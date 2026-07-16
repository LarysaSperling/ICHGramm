import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

const socket = io(socketUrl, {
  path: "/socket.io",
  autoConnect: false,

  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,

  timeout: 10000,
});

export default socket;