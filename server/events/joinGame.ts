import { ClientToServerEvents, TypedServerSocket } from "types/SocketIO";
import { sanitize } from "../utils/sanitize";
import { games, io } from "..";
import { NAME_MAX_LENGTH, ROOM_SIZE_LIMIT, UUID_LENGTH } from "types/constants";
import { Player, sanitizeGameState } from "types/Game";

type Args = Parameters<ClientToServerEvents["joinGame"]>;

export function onJoinGame(socket: TypedServerSocket, [data, callback]: Args) {
    const { code, name, authToken, clientApiHash } = sanitize(data);
    if (typeof authToken !== "string" || authToken.length != UUID_LENGTH) {
        callback({ success: false, error: "Bad auth token" });
        return;
    }

    // Name length
    if (name.length > NAME_MAX_LENGTH) {
        callback({
            success: false,
            error: "Name too long."
        });
        return;
    }

    // Check if game room with this code exists
    const game = games.get(code);
    if (game == undefined) {
        callback({
            success: false,
            error: "Game room not found: " + code.toUpperCase()
        });
        return;
    }

    // TODO see if this is still necessary
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
            callback({ success: false, error: "That name is already taken." });
            return;
        }
    }

    // Check client api version
    const { VITE_CLIENT_API_HASH } = Bun.env;
    if (clientApiHash != VITE_CLIENT_API_HASH) {
        callback({ success: false, error: "Client out of date." });
        return;
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

        if (game.players.length >= ROOM_SIZE_LIMIT) {
            callback({ success: false, error: "Game is full." });
            return;
        }

        if (game.stage == "lobby") {
            const player = new Player(name, authToken);
            game.players.push(player);
            game.chat.push({ message: `${name} joined the game!`, color: "yellow" });

            if (game.players.length == 1) game.host = player;
        } else {
            callback({ success: false, error: "Game already in progress." });
            return;
        }
    }

    socket.join(code);
    socket.data.authToken = authToken;
    socket.data.roomCode = code;

    callback({ success: true });
    io.to(code).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
}
