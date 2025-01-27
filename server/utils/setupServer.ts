import express from "express";
import { createServer } from "http";
import { TypedServer } from "types/SocketIO";

export function setupServer() {
    const { NODE_ENV, VITE_SERVER_PORT } = Bun.env;
    const app = express();
    const httpServer = createServer(app);

    let io: TypedServer;
    if (NODE_ENV === "development") {
        io = new TypedServer(httpServer, {
            cors: { origin: "*" }
        });
    } else {
        io = new TypedServer(httpServer);

        app.use(express.static(".vite"));
        app.use("/game/*code", express.static(".vite"));
    }

    httpServer.listen(VITE_SERVER_PORT, () => {
        console.log(`Server listening on port ${VITE_SERVER_PORT}`);
    });

    return io;
}
