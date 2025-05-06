import io from "socket.io-client";

const SOCKET_URL = "http://localhost:2000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export type SocketType = typeof socket;

export default socket;
