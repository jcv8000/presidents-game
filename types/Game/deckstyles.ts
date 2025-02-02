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
