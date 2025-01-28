// prettier-ignore
const NORMAL_CARDS_RANK = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type CARD_RANK = (typeof NORMAL_CARDS_RANK)[number] | "JOKER";

export type Card = {
    rank: CARD_RANK;
    suit: "CLUBS" | "SPADES" | "HEARTS" | "DIAMONDS" | "JOKER";
};

export const CARD_VALUES: { [key in CARD_RANK]: number } = {
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
    "2": 15,
    JOKER: 16
};

function newDeck() {
    const deck = NORMAL_CARDS_RANK.flatMap((value) => {
        return [
            { rank: value, suit: "CLUBS" } as Card,
            { rank: value, suit: "SPADES" } as Card,
            { rank: value, suit: "HEARTS" } as Card,
            { rank: value, suit: "DIAMONDS" } as Card
        ];
    });
    deck.push({ rank: "JOKER", suit: "JOKER" });
    deck.push({ rank: "JOKER", suit: "JOKER" });
    return deck;
}

export class Player {
    name = "";
    connected = true;

    /**
     * PRIVATE - DO NOT SEND TO CLIENTS.
     */
    authToken = "";

    constructor(name: string, authToken: string) {
        this.name = name;
        this.authToken = authToken;
    }

    // Game data
    hand: Card[] = [];
}

type Chat = {
    message: string;
    color?: string;
};
export class GameState {
    host: Player | null = null;

    // lobby -> in-game -> between-rounds -> trading-cards -> in-game -> ...
    stage: "lobby" | "in-game" | "trading-cards" = "lobby";

    players: Player[] = [];
    chat: Chat[] = [];

    currentCard: Card[] = [];
    whosTurn: Player | null = null;
    stillHasCards: Player[] = [];
    skipped = 0;
    cardsPlayedCount: { [key in CARD_RANK]: number } = {
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0,
        "10": 0,
        J: 0,
        Q: 0,
        K: 0,
        A: 0,
        "2": 0,
        JOKER: 0
    };
    whoPlayedLastCard: Player | null = null;

    round = 0;
    president: Player | null = null;
    vicePresident: Player | null = null;
    secondToLast: Player | null = null;
    loser: Player | null = null;

    private dealCards() {
        this.players.forEach((p) => (p.hand = []));

        // Shuffle deck
        let deck = newDeck();
        deck = deck
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

        // TODO offset "who the dealer is" for each round
        for (let i = 0; i < 54; i++) {
            const card = deck.shift();
            if (card) this.players[(i + this.round) % this.players.length].hand.push(card);
        }
    }

    resetCardsPlayedCount() {
        this.cardsPlayedCount = {
            "3": 0,
            "4": 0,
            "5": 0,
            "6": 0,
            "7": 0,
            "8": 0,
            "9": 0,
            "10": 0,
            J: 0,
            Q: 0,
            K: 0,
            A: 0,
            "2": 0,
            JOKER: 0
        };
    }

    startFirstRound() {
        this.dealCards();
        this.whosTurn = this.players[0];
        this.currentCard = [];
        this.stillHasCards = Array.from(this.players);
        this.skipped = 0;
        this.resetCardsPlayedCount();
    }

    startNewRound() {
        this.round++;

        this.dealCards();
        this.whosTurn = this.players[0];
        this.currentCard = [];
        this.stillHasCards = Array.from(this.players);
        this.skipped = 0;
        this.resetCardsPlayedCount();

        // make president/vice/2nd to last/loser swap cards
    }
}

export type SanitizedGameState = GameState & { sanitized: true };
export function sanitizeGameState(state: GameState) {
    const newState = structuredClone(state) as SanitizedGameState;

    newState.players.forEach((p) => {
        p.authToken = "";
        // p.hand.forEach((c) => {
        //     c.suit = "JOKER";
        //     c.value = "JOKER";
        // });
    });

    return newState;
}
