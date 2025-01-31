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
            cors: { origin: "*" },
            transports: ["polling"]
        });
    } else {
        io = new TypedServer(httpServer, { transports: ["polling"] });

        app.use(express.static("dist/client"));
        app.use("/game/*code", express.static("dist/client"));
    }

    httpServer.listen(VITE_SERVER_PORT, () => {
        console.log(`Server listening on port ${VITE_SERVER_PORT}`);
    });

    return io;
}
