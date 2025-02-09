import { DisconnectReason } from "socket.io";
import { sanitizeGameState } from "types/Game";
import { TypedServerSocket } from "types/SocketIO";
import { games, io } from "..";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = { reason: DisconnectReason; description?: any };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function onDisconnecting(socket: TypedServerSocket, args: Args) {
    const { roomCode, authToken } = socket.data;

    const game = games.get(roomCode);
    if (game == undefined) return;

    const player = game.players.find((p) => p.authToken == authToken);
    if (player == undefined) return;

    player.connected = false;
    game.chat.push({ message: `${player.name} disconnected.`, color: "red" });

    io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game));
}
