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

export function newDeck() {
    // const deck = NORMAL_CARDS_RANK.flatMap((value) => {
    //     return [
    //         { rank: value, suit: "CLUBS" } as Card,
    //         { rank: value, suit: "SPADES" } as Card,
    //         { rank: value, suit: "HEARTS" } as Card,
    //         { rank: value, suit: "DIAMONDS" } as Card
    //     ];
    // });
    // deck.push({ rank: "JOKER", suit: "JOKER" });
    // deck.push({ rank: "JOKER", suit: "JOKER" });

    const deck: Card[] = [];

    deck.push({ rank: "3", suit: "CLUBS" });
    deck.push({ rank: "JOKER", suit: "JOKER" });
    deck.push({ rank: "JOKER", suit: "JOKER" });
    deck.push({ rank: "JOKER", suit: "JOKER" });

    return deck;
}
