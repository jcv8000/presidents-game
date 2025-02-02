import { ClientToServerEvents, TypedServerSocket } from "types/SocketIO";
import { generateRoomCode } from "../utils/generateRoomCode";
import { games } from "..";
import { GameState } from "types/Game";

type Args = Parameters<ClientToServerEvents["createNewGame"]>;

export function onCreateNewGame(socket: TypedServerSocket, [callback]: Args) {
    let code = generateRoomCode();

    while (games.has(code)) {
        // Code already in use
        code = generateRoomCode();
    }

    const game = new GameState();
    games.set(code, game);

    callback({ success: true, code: code });
}
