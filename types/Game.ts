export class Player {
    name = "";
    connected = true;

    /**
     * PRIVATE - DO NOT SEND TO CLIENTS.
     */
    authToken = "";

    // Game data
    chatsSent = 0;

    constructor(name: string, authToken: string) {
        this.name = name;
        this.authToken = authToken;
    }
}

type Chat = {
    message: string;
    color?: string;
};

export class GameState {
    players: Player[] = [];
    chat: Chat[] = [];
}

export type SanitizedGameState = GameState & { sanitized: true };
export function sanitizeAuthTokens(state: GameState) {
    const newState = structuredClone(state) as SanitizedGameState;

    newState.players.forEach((p) => (p.authToken = ""));

    return newState;
}
