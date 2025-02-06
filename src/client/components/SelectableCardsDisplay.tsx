import classes from "./SelectableCardsDisplay.module.css";

import { Center, Flex, Group } from "@mantine/core";
import { Card, DeckStyle } from "types/Game";
import { JSX } from "react";
import clsx from "clsx";

export function SelectableCardsDisplay(props: {
    cards: Card[];
    deckStyle: DeckStyle;
    selected: number[];
    onChange?: (value: number[]) => void;
    limit?: number;
}) {
    const { cards, deckStyle, selected, onChange, limit } = props;

    return (
        <Flex justify="center" align="center" wrap="wrap" gap="xs">
            {cards.map((c, cardIndex) => {
                let suit: JSX.Element = <></>;
                let color = "";
                if (c.suit == "CLUBS") [suit, color] = [<>♣&#xFE0E;</>, deckStyle.black];
                if (c.suit == "DIAMONDS") [suit, color] = [<>♦&#xFE0E;</>, deckStyle.red];
                if (c.suit == "HEARTS") [suit, color] = [<>♥&#xFE0E;</>, deckStyle.red];
                if (c.suit == "SPADES") [suit, color] = [<>♠&#xFE0E;</>, deckStyle.black];
                if (c.suit == "JOKER" || c.suit == "JOKER2")
                    [suit, color] = [<>?</>, deckStyle.black]; // ☠

                const showSuit = deckStyle.showSuit == undefined ? true : deckStyle.showSuit;
                const isSelected = selected.includes(cardIndex);

                return (
                    <span
                        key={cardIndex}
                        className={clsx(classes.presidentsCard, isSelected && classes.selected)}
                        style={{
                            color: color,
                            backgroundColor: deckStyle.bg,
                            backgroundImage: deckStyle.bgImageUrl
                                ? `url(${deckStyle.bgImageUrl})`
                                : "",
                            textShadow: deckStyle.textShadow
                        }}
                        onClick={() => {
                            if (onChange) {
                                if (isSelected) {
                                    const newSelected = Array.from(selected);
                                    newSelected.splice(newSelected.indexOf(cardIndex), 1);
                                    onChange(newSelected);
                                } else {
                                    if (selected.length < (limit || 54))
                                        onChange([...selected, cardIndex]);
                                }
                            }
                        }}
                    >
                        <Center
                            style={{
                                color: showSuit ? "" : "transparent",
                                textShadow: showSuit ? deckStyle.textShadow || "none" : "none"
                            }}
                        >
                            {suit}
                        </Center>

                        <span className={classes.suit} style={{ top: 0, left: "7px" }}>
                            {c.rank}
                        </span>

                        <span className={classes.suit} style={{ bottom: 0, right: "8px" }}>
                            {c.rank}
                        </span>
                    </span>
                );
            })}
        </Flex>
    );
}
