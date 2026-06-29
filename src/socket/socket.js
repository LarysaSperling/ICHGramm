import { Server } from "socket.io";

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinUserRoom", (userId) => {
      onlineUsers.set(userId, socket.id);

      socket.join(userId);

      io.emit("onlineUsers", [...onlineUsers.keys()]);

      console.log(`User joined room: ${userId}`);
    });

    socket.on("joinChat", (chatRoom) => {
      socket.join(chatRoom);

      console.log(`Joined chat: ${chatRoom}`);
    });

    socket.on("typing", ({ chatRoom, user }) => {
      socket.to(chatRoom).emit("typing", user);
    });

    socket.on("stopTyping", (chatRoom) => {
      socket.to(chatRoom).emit("stopTyping");
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      }

      io.emit("onlineUsers", [...onlineUsers.keys()]);

      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export default initializeSocket;