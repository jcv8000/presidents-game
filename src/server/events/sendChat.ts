import { ClientToServerEvents, TypedServerSocket } from "types/SocketIO";
import { sanitize } from "../utils/sanitize";
import { games, io } from "..";
import { ROOM_SIZE_LIMIT } from "types/constants";
import { sanitizeGameState } from "types/Game";

type Args = Parameters<ClientToServerEvents["sendChat"]>;

export function onSendChat(socket: TypedServerSocket, [data, callback]: Args) {
    const { authToken, roomCode } = socket.data;
    const { chat } = sanitize(data);

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

    if (game.players.length < 2) {
        callback({ success: false, error: "Not enough players." });
        return;
    }

    if (game.players.length > ROOM_SIZE_LIMIT) {
        callback({ success: false, error: "Too many players." });
        return;
    }

    game.chat.push({ message: `${player.name}: ${chat}` });

    io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
    callback({ success: true });
}
