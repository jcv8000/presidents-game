// prettier-ignore
const NORMAL_CARDS_RANK = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type CARD_RANK = (typeof NORMAL_CARDS_RANK)[number] | "JOKER";

export type Card = {
    rank: CARD_RANK;
    suit: "CLUBS" | "SPADES" | "HEARTS" | "DIAMONDS" | "JOKER";
};
export function cardReferencesEquivalent(a: Card, b: Card) {
    return a.rank == b.rank && a.suit == b.suit;
}

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

export type DeckStyle = {
    bg: string;
    red: string;
    black: string;
    bgImageUrl?: string;
    textShadow?: React.CSSProperties["textShadow"];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeckStyleNames = ["Default", "Dark", "Gambit", "Kobe", "Libby"] as const;
export type DeckStyleName = (typeof DeckStyleNames)[number];
export const DECK_STYLES: Record<(typeof DeckStyleNames)[number], DeckStyle> = {
    Default: {
        bg: "#fefefe",
        red: "red",
        black: "black"
    },
    Dark: {
        bg: "#1a1a1a",
        red: "#ffcc00",
        black: "#ffcc00"
    },
    Gambit: {
        bg: "black",
        red: "#ffcc00",
        black: "#ffcc00",
        bgImageUrl: "/img/gambit.jpg",
        textShadow: "3px 3px rgba(0, 0, 0, 0.5)"
    },
    Kobe: {
        bg: "black",
        red: "white",
        black: "white",
        bgImageUrl: "/img/kobe.jpg",
        textShadow: "2px 2px rgba(0, 0, 0, 0.5)"
    },
    Libby: {
        bg: "black",
        red: "red",
        black: "black",
        bgImageUrl: "/img/libby.jpg",
        textShadow: "2px 2px rgba(0, 0, 0, 0.1)"
    }
};

export class GameState {
    host: Player | null = null;

    // lobby -> in-game -> trading-cards -> in-game -> ...
    stage: "lobby" | "in-game" | "ended" = "lobby";

    players: Player[] = [];
    chat: Chat[] = [];

    currentCard: Card[] = [];
    whosTurn: Player | null = null;
    stillHasCards: Player[] = [];
    skip = 0;
    // sameCardsPlayedInARow: Card[] = [];
    whoPlayedLastCard: Player | null = null;

    round = 0;
    firstPlayOfRound = true;
    president: Player | null = null;
    vicePresident: Player | null = null;
    secondToLast: Player | null = null;
    loser: Player | null = null;

    deckStyle: DeckStyle = DECK_STYLES.Default;

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
            if (card) this.players[(i + this.round - 1) % this.players.length].hand.push(card);
        }
    }

    startRound() {
        this.round++;
        this.dealCards();
        if (this.round >= 2) {
            // make players trade cards
        }

        this.players.forEach((p) => {
            p.hand.forEach((c) => {
                if (cardReferencesEquivalent(c, { rank: "3", suit: "CLUBS" })) this.whosTurn = p;
            });
        });

        this.currentCard = [];
        this.stillHasCards = Array.from(this.players);
        this.skip = 0;
        this.whoPlayedLastCard = null;
        this.firstPlayOfRound = true;
    }
}

/* TODO in socket events, send out fully sanitized gameState to all OTHER players,
   send out gameState with that player's hand in-tact to sender */
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
