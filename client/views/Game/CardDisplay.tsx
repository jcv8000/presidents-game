import { Center, Group } from "@mantine/core";
import classes from "./CardDisplay.module.css";
import { Card, DeckStyle } from "types/Game";

export function CardsDisplay(props: { cards: Card[]; deckStyle: DeckStyle }) {
    const { cards, deckStyle } = props;
    return (
        <Group gap="xs">
            {cards.map((c, index) => {
                let suit = "";
                let color = "";
                if (c.suit == "CLUBS") [suit, color] = ["♣", deckStyle.black];
                if (c.suit == "DIAMONDS") [suit, color] = ["♦", deckStyle.red];
                if (c.suit == "HEARTS") [suit, color] = ["♥", deckStyle.red];
                if (c.suit == "SPADES") [suit, color] = ["♠", deckStyle.black];

                return (
                    <>
                        <span
                            key={index}
                            className={classes.presidentsCard}
                            style={{
                                color: color,
                                backgroundColor: deckStyle.bg,
                                backgroundImage: deckStyle.bgImageUrl
                                    ? `url(${deckStyle.bgImageUrl})`
                                    : "",
                                textShadow: deckStyle.textShadow
                            }}
                        >
                            <Center>{suit}</Center>

                            <span className={classes.suit} style={{ top: 0, left: "7px" }}>
                                {c.rank}
                            </span>

                            <span className={classes.suit} style={{ bottom: 0, right: "8px" }}>
                                {c.rank}
                            </span>
                        </span>
                    </>
                );
            })}
        </Group>
    );
}
