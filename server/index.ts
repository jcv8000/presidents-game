import { UUID_LENGTH } from "types/constants";
import { GameState, Player, sanitizeAuthTokens } from "types/Game";
import { generateRoomCode } from "./utils/generateRoomCode";
import { setupServer } from "./utils/setupServer";

const io = setupServer();
const games = new Map<string, GameState>();

io.on("connection", (socket) => {
    socket.on("disconnecting", () => {
        const { roomCode, authToken } = socket.data;

        const game = games.get(roomCode);
        if (game == undefined) return;

        const player = game.players.find((p) => p.authToken == authToken);
        if (player == undefined) return;

        player.connected = false;
        game.chat.push({ message: `${player.name} disconnected.`, color: "red" });

        io.to(roomCode).emit("gameStateUpdate", sanitizeAuthTokens(game));
    });

    socket.on("createNewGame", (callback) => {
        let code = generateRoomCode();

        while (games.has(code)) {
            // Code already in use
            code = generateRoomCode();
        }

        const game = new GameState();
        games.set(code, game);

        callback({ success: true, code: code });
    });

    socket.on("joinGame", ({ code, name, authToken }, callback) => {
        if (typeof authToken !== "string" || authToken.length != UUID_LENGTH) {
            callback({ success: false, error: "Bad auth token" });
            return;
        }

        // Check if game room with this code exists
        const game = games.get(code);
        if (game == undefined) {
            callback({
                success: false,
                error: "Game not found with this code: " + code.toUpperCase()
            });
            return;
        }

        if (process.env.NODE_ENV !== "development") {
            if (socket.rooms.size > 1) {
                callback({ success: false, error: "WebSocket is already in a room." });
                return;
            }
        }

        // Check if this name is already taken by someone else (different auth token)
        const nameMatch = game.players.find((p) => p.name == name);
        if (nameMatch) {
            if (nameMatch.authToken != authToken) {
                callback({ success: false, error: "That name is already taken in this room." });
                return;
            }
        }

        // Check if existing player reconnecting
        const authMatch = game.players.find((p) => p.authToken == authToken);
        if (authMatch) {
            // Name might have changed
            if (authMatch.name != name) {
                game.chat.push({
                    message: `${authMatch.name} rejoined as ${name}.`,
                    color: "yellow"
                });
                authMatch.name = name;
            } else {
                game.chat.push({ message: `${name} reconnected.`, color: "yellow" });
            }

            authMatch.connected = true;
        } else {
            // New player connection
            game.players.push(new Player(name, authToken));
            game.chat.push({ message: `${name} joined the game!`, color: "yellow" });
        }

        socket.join(code);
        socket.data.authToken = authToken;
        socket.data.roomCode = code;

        callback({ success: true });
        io.to(code).emit("gameStateUpdate", sanitizeAuthTokens(game)); // includes sender
    });

    socket.on("sendChat", ({ chat }, callback) => {
        const { authToken, roomCode } = socket.data;

        const game = games.get(roomCode);
        if (game == undefined) {
            callback({ success: false, error: "Room code not found." });
            return;
        }

        const player = game.players.find((p) => p.authToken == authToken);
        if (player == undefined) {
            callback({ success: false, error: "Player is not in this room." });
            return;
        }

        game.chat.push({ message: `${player.name}: ${chat}` });
        player.chatsSent++;

        io.to(roomCode).emit("gameStateUpdate", sanitizeAuthTokens(game)); // includes sender
        callback({ success: true });
    });
});
