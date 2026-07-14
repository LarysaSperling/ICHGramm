import { io } from "socket.io-client";

const socket = io(
  "http://localhost:5000",
  {
    path: "/socket.io",
    autoConnect: false,

    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,

    timeout: 10000,
  },
);

export default socket;