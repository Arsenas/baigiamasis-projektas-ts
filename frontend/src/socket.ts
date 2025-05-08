import io from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "";

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export type SocketType = typeof socket;

export default socket;
