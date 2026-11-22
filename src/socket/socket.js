import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";

import User from "../models/User.js";
import isTokenRevoked from "../utils/isTokenRevoked.js";

// userId -> Set of socket ids. A user can have several tabs or devices
// open; they are online while at least one of them is connected
// (REVIEW M-7: with one socket id per user, closing one of two tabs
// made the user "offline").
const onlineUsers = new Map();

const getOnlineUserIds = () => [...onlineUsers.keys()];

// Returns true if the user was offline before this socket.
const addOnlineSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);

  if (sockets) {
    sockets.add(socketId);
    return false;
  }

  onlineUsers.set(userId, new Set([socketId]));
  return true;
};

// Returns true if this was the user's last socket.
const removeOnlineSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);

  if (!sockets || !sockets.delete(socketId)) {
    return false;
  }

  if (sockets.size > 0) {
    return false;
  }

  onlineUsers.delete(userId);
  return true;
};

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      next(new Error("Not authorized"));
      return;
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
      );
    } catch (error) {
      // The client logs out on both messages; "Session expired"
      // only makes the reason clearer.
      next(
        new Error(
          error.name === "TokenExpiredError"
            ? "Session expired"
            : "Not authorized",
        ),
      );
      return;
    }

    const user = await User.findById(decoded.userId)
      .select("_id username +passwordChangedAt")
      .lean();

    if (!user) {
      next(new Error("Not authorized"));
      return;
    }

    // Password changed after this token was issued (REVIEW H-13).
    if (isTokenRevoked(decoded, user)) {
      next(new Error("Session expired"));
      return;
    }

    socket.data.userId = user._id.toString();
    socket.data.username = user.username;
    socket.data.tokenExpiresAt = decoded.exp * 1000;

    next();
  } catch {
    next(new Error("Not authorized"));
  }
};

// A chat room is "<userIdA>_<userIdB>" with ids sorted (see
// utils/chatRoom.js). It is only a name for the chat: sockets do not join
// it. All chat events go to the personal rooms of the participants
// (REVIEW H-10), so there is no room membership that could leak from one
// chat to another or get lost on reconnect.
//
// Returns the other participant's id, or null if `userId` is not one of
// the two participants (or the name is malformed / a chat with oneself).
const getChatPartner = (chatRoom, userId) => {
  if (typeof chatRoom !== "string") {
    return null;
  }

  const participants = chatRoom.split("_");

  if (
    participants.length !== 2 ||
    !participants.every((id) =>
      mongoose.isObjectIdOrHexString(id),
    )
  ) {
    return null;
  }

  const expectedRoom = [...participants]
    .sort()
    .join("_");

  if (
    chatRoom !== expectedRoom ||
    !participants.includes(userId)
  ) {
    return null;
  }

  const partner = participants.find(
    (id) => id !== userId,
  );

  return partner || null;
};

// stopTyping used to be sent as a plain string; accept both forms.
const readChatRoom = (payload) =>
  typeof payload === "string"
    ? payload
    : payload?.chatRoom;

const initializeSocket = (
  server,
  allowedOrigins = [],
) => {
  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (
          !origin ||
          allowedOrigins.includes(origin)
        ) {
          callback(null, true);
          return;
        }

        callback(
          new Error(
            "Socket.io CORS blocked this origin",
          ),
        );
      },
      methods: [
        "GET",
        "POST",
        "PUT",
        "DELETE",
      ],
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const { userId, username } = socket.data;

    console.log(
      "User connected:",
      socket.id,
    );

    const cameOnline = addOnlineSocket(userId, socket.id);

    socket.join(userId);

    // The JWT is checked only on connect. Close the connection when the
    // token expires, so an open tab cannot keep receiving events with an
    // expired session. setTimeout cannot wait longer than ~24.8 days
    // (2^31-1 ms): such a long-lived connection is simply not timed.
    const msUntilExpiry =
      socket.data.tokenExpiresAt - Date.now();
    const expiryTimer =
      msUntilExpiry <= MAX_TIMEOUT_MS
        ? setTimeout(() => {
            socket.emit("sessionExpired");
            socket.disconnect(true);
          }, Math.max(msUntilExpiry, 0))
        : null;

    // Everyone needs the new list only if this user was offline before.
    // This socket always gets it: it may be a new tab, or a reconnect
    // that missed changes while it was offline.
    if (cameOnline) {
      io.emit("onlineUsers", getOnlineUserIds());
    } else {
      socket.emit("onlineUsers", getOnlineUserIds());
    }

    // The Messages page asks for the list when it opens: the socket is
    // connected for the whole app, so the "onlineUsers" event above has
    // usually come before the page was there to listen.
    socket.on("getOnlineUsers", (callback) => {
      if (typeof callback === "function") {
        callback(getOnlineUserIds());
      }
    });

    // "joinChat" from older clients is simply ignored: nothing needs
    // to be joined any more.

    // Typing goes only to the other participant (all of their tabs),
    // tagged with the chat it belongs to, so the client can show it in
    // the right chat only.
    socket.on("typing", (payload) => {
      const chatRoom = readChatRoom(payload);
      const partner = getChatPartner(chatRoom, userId);

      if (!partner) {
        return;
      }

      socket.to(partner).emit("typing", {
        _id: userId,
        username,
        chatRoom,
      });
    });

    socket.on("stopTyping", (payload) => {
      const chatRoom = readChatRoom(payload);
      const partner = getChatPartner(chatRoom, userId);

      if (!partner) {
        return;
      }

      socket.to(partner).emit("stopTyping", {
        _id: userId,
        chatRoom,
      });
    });

    socket.on("disconnect", () => {
      clearTimeout(expiryTimer);

      if (removeOnlineSocket(userId, socket.id)) {
        io.emit("onlineUsers", getOnlineUserIds());
      }

      console.log(
        "User disconnected:",
        socket.id,
      );
    });
  });

  return io;
};

export default initializeSocket;
