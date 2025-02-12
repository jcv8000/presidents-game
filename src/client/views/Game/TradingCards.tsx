import classes from "./TradingCards.module.css";

import { Container, Stack, Title, Loader, Button, Space, Transition } from "@mantine/core";
import { useSnapshot } from "valtio";
import { store } from "@/utils/store";
import { sortCards } from "types/Game";
import { useState } from "react";
import { TypedClientSocket } from "types/SocketIO";
import { showErrorNotification, showGameNotification } from "@/utils/notifications";
import { CardsDisplay } from "@/components";

export default function TradingCards(props: { socket: TypedClientSocket }) {
    const { socket } = props;
    const context = useSnapshot(store);
    const state = context.gameState;

    const my = state.players.find((p) => p.name == context.name)!;

    const isPresident = my.name == state.president?.name || false;
    const isVP = my.name == state.vicePresident?.name || false;
    const is2ndToLast = my.name == state.secondToLast?.name || false;
    const isLoser = my.name == state.loser?.name || false;

    const [selectedCardIndexes, setSelectedCardIndexes] = useState<number[]>([]);

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
        const descendingHand = sortCards(my.hand, "descending");
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
                    <CardsDisplay
                        cards={descendingHand}
                        deckStyle={state.deckStyle}
                        selectedIndexes={isSmallGame ? [0] : [0, 1]}
                    />
                </Stack>
            </Container>
        );
    }

    if (isPresident || isVP) {
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

                    <CardsDisplay
                        cards={my.hand}
                        deckStyle={state.deckStyle}
                        selectedIndexes={selectedCardIndexes}
                        selectLimit={numCards}
                        onChange={setSelectedCardIndexes}
                        enableCards={(card) => {
                            if (selectedCardIndexes.length == numCards) {
                                for (let i = 0; i < selectedCardIndexes.length; i++) {
                                    if (card == my.hand[selectedCardIndexes[i]]) return true;
                                }
                                return false;
                            }
                            return true;
                        }}
                    />
                </Stack>

                <div className={classes.playBtnRoot}>
                    <Transition transition="slide-up" mounted={selectedCardIndexes.length > 0}>
                        {(transitionStyles) => (
                            <Button
                                fullWidth
                                size="md"
                                style={transitionStyles}
                                onClick={() => {
                                    socket.emit(
                                        "giveCards",
                                        { cardIndexes: selectedCardIndexes.join(",") },
                                        ({ success, error }) => {
                                            if (!success) showErrorNotification({ message: error });
                                            else showGameNotification("Traded cards.");
                                        }
                                    );
                                }}
                            >
                                Give Cards
                            </Button>
                        )}
                    </Transition>
                </div>
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
