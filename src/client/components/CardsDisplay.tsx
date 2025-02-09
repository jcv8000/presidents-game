import classes from "./CardsDisplay.module.css";

import { Center, Flex } from "@mantine/core";
import { Card, DeckStyle } from "types/Game";
import { JSX } from "react";
import clsx from "clsx";

type Props = {
    cards: Card[];
    deckStyle: DeckStyle;
    selectedIndexes?: number[];
    selectLimit?: number;
    onChange?: (v: number[]) => void;
    enableCards?: (card: Card) => boolean;
    maxWidth?: number;
};

export function CardsDisplay({
    cards,
    deckStyle,
    selectedIndexes = [],
    selectLimit = 0,
    onChange = () => {},
    enableCards,
    maxWidth
}: Props) {
    const cardElements: JSX.Element[] = [];

    cards.forEach((c, cardIndex) => {
        let disabled = false;
        if (enableCards && enableCards(c) == false) disabled = true;

        let suit: JSX.Element = <></>;
        let color = "";
        if (c.suit == "CLUBS") [suit, color] = [<>♣&#xFE0E;</>, deckStyle.black];
        if (c.suit == "DIAMONDS") [suit, color] = [<>♦&#xFE0E;</>, deckStyle.red];
        if (c.suit == "HEARTS") [suit, color] = [<>♥&#xFE0E;</>, deckStyle.red];
        if (c.suit == "SPADES") [suit, color] = [<>♠&#xFE0E;</>, deckStyle.black];
        if (c.suit == "JOKER" || c.suit == "JOKER2") [suit, color] = [<>?</>, deckStyle.black];

        const showSuit = deckStyle.showSuit == undefined ? true : deckStyle.showSuit;
        const isSelected = selectedIndexes.includes(cardIndex);

        cardElements.push(
            <span
                key={cardIndex}
                className={clsx(
                    classes.presidentsCard,
                    isSelected && classes.presidentsCardSelected,
                    disabled && classes.presidentsCardDisabled
                )}
                style={{
                    color: color,
                    backgroundColor: deckStyle.bg,
                    backgroundImage: deckStyle.bgImageUrl ? `url(${deckStyle.bgImageUrl})` : "",
                    textShadow: deckStyle.textShadow
                }}
                onClick={() => {
                    if (selectedIndexes != undefined && onChange != undefined && !disabled) {
                        if (isSelected) {
                            const newSelected = Array.from(selectedIndexes);
                            newSelected.splice(newSelected.indexOf(cardIndex), 1);
                            onChange(newSelected);
                        } else {
                            if (selectedIndexes.length < (selectLimit || 54))
                                onChange([...selectedIndexes, cardIndex]);
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
    });

    return (
        <Flex justify="center" align="center" wrap="wrap" gap="xs" maw={maxWidth}>
            {cardElements}
        </Flex>
    );
}
