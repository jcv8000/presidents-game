import classes from "./TradingCards.module.css";

import { Container, Stack, Title, Loader, Button, Space } from "@mantine/core";
import { useSnapshot } from "valtio";
import { store } from "@/utils/store";
import { Card, CARD_VALUES, cardReferencesEquivalent } from "types/Game";
import { SelectableCardsDisplay } from "@/components/SelectableCardsDisplay";
import { useState } from "react";
import { TypedClientSocket } from "types/SocketIO";
import { showErrorNotification, showGameNotification } from "@/utils/notifications";

export default function TradingCards(props: { socket: TypedClientSocket }) {
    const { socket } = props;
    const context = useSnapshot(store);
    const state = context.gameState;

    const my = state.players.find((p) => p.name == context.name)!;

    const isPresident = my.name == state.president?.name || false;
    const isVP = my.name == state.vicePresident?.name || false;
    const is2ndToLast = my.name == state.secondToLast?.name || false;
    const isLoser = my.name == state.loser?.name || false;

    const [selectedCards, setSelectedCards] = useState<number[]>([]);

    if (state.presidentAndLoserTraded && (isLoser || isPresident)) {
        return <Title>Trade done.</Title>;
    }
    if (state.vpAnd2ndTraded && (is2ndToLast || isVP)) {
        return <Title>Trade done.</Title>;
    }

    const isSmallGame = state.players.length <= 4;

    let numCards = 0;
    if (isVP) numCards = 1;
    if (isPresident) numCards = isSmallGame ? 1 : 2;

    if (isLoser || is2ndToLast) {
        const myHand = my.hand
            .map((c) => c)
            .sort((a, b) => (CARD_VALUES[b.rank] > CARD_VALUES[a.rank] ? 1 : -1));
        return (
            <Container p="lg">
                <Stack align="center">
                    {isLoser && (
                        <>
                            <Title ta="center">You lost.</Title>
                            <Title ta="center" order={2}>
                                Your {isSmallGame ? "best card" : "two best cards"} will go to{" "}
                                {state.president?.name}.
                            </Title>
                        </>
                    )}
                    {is2ndToLast && (
                        <>
                            <Title ta="center">You got 2nd to last.</Title>
                            <Title ta="center" order={2}>
                                Your best card will go to {state.vicePresident?.name}.
                            </Title>
                        </>
                    )}
                    <SelectableCardsDisplay
                        cards={myHand}
                        deckStyle={state.deckStyle}
                        selected={isSmallGame ? [0] : [0, 1]}
                        onChange={() => {}}
                    />
                </Stack>
            </Container>
        );
    }

    if (isPresident || isVP) {
        const myHand = my.hand
            .map((c) => c)
            .sort((a, b) => (CARD_VALUES[b.rank] > CARD_VALUES[a.rank] ? -1 : 1));
        return (
            <Container p="lg">
                <Stack align="center">
                    {isPresident && (
                        <>
                            <Title ta="center">You are the President.</Title>
                            <Title ta="center" order={2}>
                                Choose {isSmallGame ? "one card" : "two cards"} to give to{" "}
                                {state.loser?.name}.
                            </Title>
                        </>
                    )}
                    {isVP && (
                        <>
                            <Title ta="center">You are the Vice President.</Title>
                            <Title ta="center" order={2}>
                                Choose one card to give to {state.secondToLast?.name}.
                            </Title>
                        </>
                    )}

                    <Space h="xl" />

                    <SelectableCardsDisplay
                        cards={myHand}
                        deckStyle={state.deckStyle}
                        selected={selectedCards}
                        onChange={(v) => setSelectedCards(v)}
                        limit={numCards}
                    />

                    <Space h="xl" />

                    <Button
                        size="compact-xl"
                        onClick={() => {
                            const realIndexes: number[] = [];
                            const cards: Card[] = [];
                            for (let i = 0; i < selectedCards.length; i++) {
                                cards.push(myHand[i]);
                            }

                            cards.forEach((c) => {
                                const index = my.hand.findIndex((v) =>
                                    cardReferencesEquivalent(c, v)
                                );
                                realIndexes.push(index);
                            });

                            socket.emit(
                                "giveCards",
                                { cardIndexes: realIndexes.join(",") },
                                ({ success, error }) => {
                                    if (!success) showErrorNotification({ message: error });
                                    else showGameNotification("Traded cards.");
                                }
                            );
                        }}
                    >
                        Give Cards
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <Container p="lg">
            <Stack align="center">
                <Title>You're middle scum.</Title>
                <Title order={2}>
                    Game will continue when winners/losers are finished trading.
                </Title>
                <Loader type="dots" />
            </Stack>
        </Container>
    );
}
