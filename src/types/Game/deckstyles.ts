export type DeckStyle = {
    bg: string;
    red: string;
    black: string;
    bgImageUrl?: string;
    textShadow?: React.CSSProperties["textShadow"];
    showSuit?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeckStyleNames = [
    "Default",
    "Dark",
    "Gambit",
    "Kobe",
    "Libby",
    "Chewy",
    "Buss",
    "Maddie",
    "Drew",
    "Hayley",
    "Avery"
] as const;
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
        showSuit: false,
        textShadow: "2px 2px rgba(0, 0, 0, 0.5)"
    },
    Libby: {
        bg: "black",
        red: "red",
        black: "black",
        bgImageUrl: "/img/libby.jpg",
        showSuit: false,
        textShadow: "1px 1px rgba(0, 0, 0, 0.4)"
    },
    Chewy: {
        bg: "black",
        red: "#fefefe",
        black: "#fefefe",
        bgImageUrl: "/img/chewy.jpg",
        textShadow: "2px 2px rgba(0, 0, 0, 0.5)",
        showSuit: false
    },
    Buss: {
        bg: "black",
        red: "black",
        black: "black",
        bgImageUrl: "/img/buss.gif",
        textShadow: "1px 1px rgba(0, 0, 0, 0.5)",
        showSuit: false
    },
    Maddie: {
        bg: "black",
        red: "white",
        black: "white",
        bgImageUrl: "/img/maddie.jpg",
        textShadow: "1px 1px rgba(1, 1, 1, 0.3)",
        showSuit: false
    },
    Drew: {
        bg: "black",
        red: "white",
        black: "white",
        bgImageUrl: "/img/drew.jpg",
        textShadow: "1px 1px rgba(1, 1, 1, 0.3)",
        showSuit: false
    },
    Hayley: {
        bg: "black",
        red: "red",
        black: "black",
        bgImageUrl: "/img/hayley.jpg",
        textShadow: "2px 2px rgba(0, 0, 0, 0.5)",
        showSuit: false
    },
    Avery: {
        bg: "black",
        red: "#fefefe",
        black: "#fefefe",
        bgImageUrl: "/img/avery.jpg",
        textShadow: "2px 2px rgba(0, 0, 0, 0.5)",
        showSuit: false
    }
};
