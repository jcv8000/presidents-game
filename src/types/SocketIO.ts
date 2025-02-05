import { Socket as ClientSocket } from "socket.io-client";
import { DeckStyleName, SanitizedGameState } from "types/Game";
import { Server, Socket as ServerSocket } from "socket.io";

export interface ServerToClientEvents {
    gameStateUpdate: (state: SanitizedGameState) => void;
    notification: (message: string) => void;
}

type Response = {
    success: boolean;
    error?: string;
};

export interface ClientToServerEvents {
    createNewGame: (callback: (resp: Response & { code?: string }) => void) => void;

    joinGame: (
        data: { code: string; name: string; authToken: string; clientApiHash: string },
        callback: (resp: Response) => void
    ) => void;

    sendChat: (data: { chat: string }, callback: (resp: Response) => void) => void;

    startGame: (data: { deckStyle: DeckStyleName }, callback: (resp: Response) => void) => void;

    /** @param cardIndexes Numbers separated by commas. Example: "0,3,7" */
    playCards: (data: { cardIndexes: string }, callback: (resp: Response) => void) => void;
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
