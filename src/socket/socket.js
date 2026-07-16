import { Server } from "socket.io";

const onlineUsers = new Map();

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

  io.on("connection", (socket) => {
    console.log(
      "User connected:",
      socket.id,
    );

    socket.on("joinUserRoom", (userId) => {
      if (!userId) {
        return;
      }

      onlineUsers.set(userId, socket.id);

      socket.join(userId);

      io.emit(
        "onlineUsers",
        [...onlineUsers.keys()],
      );

      console.log(
        `User joined room: ${userId}`,
      );
    });

    socket.on("joinChat", (chatRoom) => {
      if (!chatRoom) {
        return;
      }

      socket.join(chatRoom);

      console.log(
        `Joined chat: ${chatRoom}`,
      );
    });

    socket.on(
      "typing",
      ({ chatRoom, user }) => {
        if (!chatRoom || !user) {
          return;
        }

        socket
          .to(chatRoom)
          .emit("typing", user);
      },
    );

    socket.on(
      "stopTyping",
      (chatRoom) => {
        if (!chatRoom) {
          return;
        }

        socket
          .to(chatRoom)
          .emit("stopTyping");
      },
    );

    socket.on("disconnect", () => {
      for (const [
        userId,
        socketId,
      ] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
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