import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

const socket = io(socketUrl, {
  path: "/socket.io",
  autoConnect: false,

  // Keep trying until the server is back (REVIEW H-11). A Render cold
  // start takes 30-60 s; with only 5 attempts the socket gave up after
  // ~20 s and real-time stayed dead until a page reload. The delay grows
  // 1 s -> 2 s -> 4 s and then stays at 5 s, so a sleeping server gets
  // at most one attempt every few seconds. Not retried on purpose:
  // auth errors (connect_error from the server middleware) and
  // "sessionExpired" (server-side disconnect) - the client logs out.
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,

  timeout: 10000,
});

export default socket;