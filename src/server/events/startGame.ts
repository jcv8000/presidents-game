import { ClientToServerEvents, TypedServerSocket } from "types/SocketIO";
import { sanitize } from "../utils/sanitize";
import { games, io } from "..";
import { DECK_STYLES, sanitizeGameState } from "types/Game";

type Args = Parameters<ClientToServerEvents["startGame"]>;

export function onStartGame(socket: TypedServerSocket, [data, callback]: Args) {
    const { deckStyle } = sanitize(data);
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

    if (game.players.length < 2) {
        callback({ success: false, error: "Not enough players to start." });
        return;
    }

    if (game.stage == "lobby") {
        game.deckStyle = DECK_STYLES[deckStyle];
        game.stage = "in-game";
        game.chat.push({ message: `Game is starting`, color: "green" });

        // TODO kick disconnected players on start?
        game.players = game.players.filter((p) => p.connected == true);

        game.startFirstRound();

        io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
        callback({ success: true });
    } else {
        callback({ success: false, error: "Game is already in progress." });
    }
}
