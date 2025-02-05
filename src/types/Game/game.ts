import { TIMER_DELAY_SECONDS } from "types/constants";
import { Card, cardReferencesEquivalent, newDeck } from "./cards";
import { DECK_STYLES, DeckStyle } from "./deckstyles";

type Chat = {
    message: string;
    color?: string;
};

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

/*
    TODO rewrite this to be an object like
    type GameState = {
        name: "lobby"
    } | ... | {
        name: "in-game";
        currentCard: Card[]
        whosTurn: Player | null;
        ...
    }
*/
export class GameState {
    host: Player | null = null;

    // lobby -> in-game -> round-over -> trading-cards -> in-game -> ...
    stage: "lobby" | "in-game" | "round-over" | "trading-cards" = "lobby";

    players: Player[] = [];
    chat: Chat[] = [];

    currentCard: Card[] = [];
    whosTurn: Player | null = null;
    stillHasCards: Player[] = [];
    skip = 0;
    whoPlayedLastCard: Player | null = null;
    firstPlayOfRound = true;

    round = 0;
    president: Player | null = null;
    vicePresident: Player | null = null;
    secondToLast: Player | null = null;
    loser: Player | null = null;

    deckStyle: DeckStyle = DECK_STYLES.Default;

    timer = TIMER_DELAY_SECONDS;

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

export function sanitizeGameState(state: GameState, playerSendingTo?: Player) {
    const newState = structuredClone(state) as SanitizedGameState;

    newState.players.forEach((p) => {
        // Obfuscate everyone else's cards except your own
        if (playerSendingTo) {
            if (p.authToken == playerSendingTo.authToken) {
                p.hand.forEach((c) => {
                    (c.rank = "JOKER"), (c.suit = "JOKER");
                });
            }
        }

        p.authToken = "";
    });

    return newState;
}
