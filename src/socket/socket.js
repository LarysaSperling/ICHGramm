import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";

import User from "../models/User.js";

const onlineUsers = new Map();

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
      .select("_id username")
      .lean();

    if (!user) {
      next(new Error("Not authorized"));
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

// A chat room is "<userIdA>_<userIdB>" with ids sorted.
// Only one of the two participants may join it.
const isChatParticipant = (chatRoom, userId) => {
  if (typeof chatRoom !== "string") {
    return false;
  }

  const participants = chatRoom.split("_");

  if (
    participants.length !== 2 ||
    !participants.every((id) =>
      mongoose.isValidObjectId(id),
    )
  ) {
    return false;
  }

  const expectedRoom = [...participants]
    .sort()
    .join("_");

  return (
    chatRoom === expectedRoom &&
    participants.includes(userId)
  );
};

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

    onlineUsers.set(userId, socket.id);

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

    io.emit(
      "onlineUsers",
      [...onlineUsers.keys()],
    );

    socket.on("joinChat", (chatRoom) => {
      if (!isChatParticipant(chatRoom, userId)) {
        return;
      }

      socket.join(chatRoom);
    });

    socket.on("typing", ({ chatRoom } = {}) => {
      if (!socket.rooms.has(chatRoom)) {
        return;
      }

      socket.to(chatRoom).emit("typing", {
        _id: userId,
        username,
      });
    });

    socket.on("stopTyping", (chatRoom) => {
      if (!socket.rooms.has(chatRoom)) {
        return;
      }

      socket.to(chatRoom).emit("stopTyping");
    });

    socket.on("disconnect", () => {
      clearTimeout(expiryTimer);

      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
      }

      io.emit(
        "onlineUsers",
        [...onlineUsers.keys()],
      );

      console.log(
        "User disconnected:",
        socket.id,
      );
    });
  });

  return io;
};

export default initializeSocket;
