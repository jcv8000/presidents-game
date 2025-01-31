import { io } from "socket.io-client";
import { TypedClientSocket } from "types/SocketIO";

let s: TypedClientSocket;

if (import.meta.env.DEV) {
    s = io(`${import.meta.env.VITE_DEV_HOST}:${import.meta.env.VITE_SERVER_PORT}`, {
        autoConnect: false
    });
} else {
    s = io({
        port: import.meta.env.VITE_SERVER_PORT,
        autoConnect: false
    });
}

export const socket = s;
