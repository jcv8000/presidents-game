import { Socket as ClientSocket } from "socket.io-client";
import { SanitizedGameState, Card } from "types/Game";
import { Server, Socket as ServerSocket } from "socket.io";

interface ServerToClientEvents {
    gameStateUpdate: (state: SanitizedGameState) => void;
    playerSkipped: (name: string) => void;
}

type Response = {
    success: boolean;
    error?: string;
};

interface ClientToServerEvents {
    createNewGame: (callback: (resp: Response & { code?: string }) => void) => void;

    joinGame: (
        data: { code: string; name: string; authToken: string },
        callback: (resp: Response) => void
    ) => void;

    sendChat: (resp: { chat: string }, callback: (resp: Response) => void) => void;

    startGame: (callback: (resp: Response) => void) => void;

    playCards: (data: { cards: Card[] }, callback: (resp: Response) => void) => void;

    knock: (callback: (resp: Response) => void) => void;
}

interface SocketData {
    authToken: string;
    roomCode: string;
}

// Exports

export type TypedClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

export type TypedServerSocket = ServerSocket<
    ClientToServerEvents,
    ServerToClientEvents,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {},
    SocketData
>;

export class TypedServer extends Server<
    ClientToServerEvents,
    ServerToClientEvents,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {},
    SocketData
> {}
