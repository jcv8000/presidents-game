import { Center, Group } from "@mantine/core";
import classes from "./CardDisplay.module.css";
import { Card, DeckStyle } from "types/Game";
import { JSX } from "react";

export function CardsDisplay(props: { cards: Card[]; deckStyle: DeckStyle }) {
    const { cards, deckStyle } = props;
    return (
        <Group gap="xs">
            {cards.map((c, index) => {
                let suit: JSX.Element = <></>;
                let color = "";
                if (c.suit == "CLUBS") [suit, color] = [<>♣&#xFE0E;</>, deckStyle.black];
                if (c.suit == "DIAMONDS") [suit, color] = [<>♦&#xFE0E;</>, deckStyle.red];
                if (c.suit == "HEARTS") [suit, color] = [<>♥&#xFE0E;</>, deckStyle.red];
                if (c.suit == "SPADES") [suit, color] = [<>♠&#xFE0E;</>, deckStyle.black];

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
