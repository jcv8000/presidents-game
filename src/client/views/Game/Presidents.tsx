import classes from "./Presidents.module.css";

// prettier-ignore
import { Button, Container, Stack, Text, Title, Transition } from "@mantine/core";
import { showErrorNotification } from "@/utils/notifications";
import { store } from "@/utils/store";
import { Card, CARD_VALUES } from "types/Game";
import { TypedClientSocket } from "types/SocketIO";
import { useSnapshot } from "valtio";
import { CardsDisplay } from "@/components";
import { JSX, useState } from "react";

export default function Presidents(props: { socket: TypedClientSocket }) {
    const { socket } = props;
    const context = useSnapshot(store);

    const state = context.gameState;
    const players = state.players;

    const my = state.players.find((p) => p.name == context.name)!;

    const isMyTurn = state.whosTurn?.name == context.name || false;

    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

    let goodToPlay = false;
    if (my.hand.length > 0) {
        if (state.currentCard.length > 0 && selectedIndexes.length == state.currentCard.length)
            goodToPlay = true;
        if (state.currentCard.length == 0 && selectedIndexes.length > 0) goodToPlay = true;
        if (selectedIndexes.length == 1 && my.hand[selectedIndexes[0]].rank == "JOKER")
            goodToPlay = true;
    }

    let topButton = (
        <Button size="compact-xl" mb="sm" disabled={true}>
            Select cards to play.
        </Button>
    );
    if (state.currentCard.length > 0) {
        topButton = (
            <Button
                color="red"
                size="compact-xl"
                mb="sm"
                onClick={() => {
                    // Knock
                    socket.emit("playCards", { cardIndexes: "" }, ({ error }) => {
                        if (error) showErrorNotification({ message: error });
                    });
                    setSelectedIndexes([]);
                    window.scrollTo({ top: 0 });
                }}
            >
                KNOCK
            </Button>
        );
    }
    if (selectedIndexes.length > 0) {
        topButton = (
            <Button
                size="compact-xl"
                mb="sm"
                onClick={() => {
                    setSelectedIndexes([]);
                    socket.emit(
                        "playCards",
                        { cardIndexes: selectedIndexes.join(",") },
                        ({ success, error }) => {
                            if (!success) showErrorNotification({ message: error });
                        }
                    );
                }}
                disabled={!goodToPlay}
            >
                {goodToPlay ? (
                    playButtonText(selectedIndexes.map((i) => my.hand[i]))
                ) : (
                    <>Select {state.currentCard.length - selectedIndexes.length} more card(s).</>
                )}
            </Button>
        );
    }

    return (
        <Container size="md">
            <Stack align="center" mb={64}>
                <table className={classes.table}>
                    <tbody>
                        <tr>
                            {players.map((p) => (
                                <td key={p.name}>{p.name}</td>
                            ))}
                        </tr>
                        <tr>
                            {players.map((p) => {
                                let text = <>{p.hand.length.toString()}</>;
                                if (state.president?.name == p.name)
                                    text = <b color="red">PRESIDENT</b>;
                                else if (state.vicePresident?.name == p.name)
                                    text = <b color="blue">VICE PRES</b>;
                                else if (state.secondToLast?.name == p.name) text = <b>2ND LAST</b>;
                                else if (state.loser?.name == p.name) text = <b>LOSER</b>;
                                else if (p.hand.length == 0) text = <>OUT</>;

                                return <td key={p.name}>{text}</td>;
                            })}
                        </tr>
                    </tbody>
                </table>

                <Title order={2}>
                    <CardsDisplay cards={state.currentCard} deckStyle={state.deckStyle} />
                </Title>

                {isMyTurn && (
                    <>
                        <Title order={2}>
                            {state.currentCard.length == 0 ? <>You start.</> : <>It's your turn.</>}
                        </Title>

                        {topButton}

                        <CardsDisplay
                            cards={my.hand}
                            deckStyle={state.deckStyle}
                            selectedIndexes={selectedIndexes}
                            onChange={setSelectedIndexes}
                            selectLimit={
                                state.currentCard.length == 0 ? 4 : state.currentCard.length
                            }
                            enableCards={(card) => {
                                if (state.firstPlayOfRound) {
                                    // First play of round, if they have 3 of clubs they can play any # of 3's
                                    if (
                                        my.hand.filter((c) => c.rank == "3" && c.suit == "CLUBS")
                                            .length == 1
                                    ) {
                                        if (card.rank == "3") return true;
                                    }
                                }

                                if (state.currentCard.length > 0) {
                                    const currentCardRank = state.currentCard[0].rank;

                                    // Disable cards lower than current rank
                                    if (CARD_VALUES[card.rank] < CARD_VALUES[currentCardRank])
                                        return false;

                                    // Disable cards they have less than (currentCard.length) of, unless Joker
                                    const count = my.hand.filter((c) => c.rank == card.rank).length;
                                    if (
                                        count > 0 &&
                                        count < state.currentCard.length &&
                                        card.rank != "JOKER"
                                    )
                                        return false;
                                }

                                // Disable other ranks if one is selected
                                if (selectedIndexes.length > 0) {
                                    const selectedRank = my.hand[selectedIndexes[0]].rank;
                                    if (card.rank != selectedRank) return false;
                                }

                                return true;
                            }}
                        />

                        <div className={classes.playBtnRoot}>
                            <Transition transition="slide-up" mounted={selectedIndexes.length > 0}>
                                {(transitionStyles) => (
                                    <Button
                                        fullWidth
                                        radius={0}
                                        style={transitionStyles}
                                        onClick={() => {
                                            socket.emit(
                                                "playCards",
                                                { cardIndexes: selectedIndexes.join(",") },
                                                ({ success, error }) => {
                                                    if (!success)
                                                        showErrorNotification({ message: error });
                                                }
                                            );
                                            setSelectedIndexes([]);
                                            window.scrollTo({ top: 0 });
                                        }}
                                        disabled={!goodToPlay}
                                    >
                                        {goodToPlay ? (
                                            playButtonText(selectedIndexes.map((i) => my.hand[i]))
                                        ) : (
                                            <>
                                                Select{" "}
                                                {state.currentCard.length - selectedIndexes.length}{" "}
                                                more card(s).
                                            </>
                                        )}
                                    </Button>
                                )}
                            </Transition>
                        </div>
                    </>
                )}

                {!isMyTurn && (
                    <>
                        <Title order={2}>{state.whosTurn?.name}'s turn.</Title>

                        <CardsDisplay
                            cards={my.hand}
                            deckStyle={state.deckStyle}
                            enableCards={() => {
                                return false;
                            }}
                        />
                    </>
                )}

                {state.president?.name == my.name && (
                    <Title order={2}>You are the President.</Title>
                )}
                {state.vicePresident?.name == my.name && (
                    <Title order={2}>You are the Vice President.</Title>
                )}
                {state.secondToLast?.name == my.name && (
                    <Title order={2}>You got 2nd to Last.</Title>
                )}
                {state.loser?.name == my.name && <Title order={2}>You lost.</Title>}
            </Stack>
        </Container>
    );
}

function playButtonText(play: Card[]) {
    if (play.length == 0) return <>Play</>;

    const card = play[0];
    if (card.rank == "JOKER") return <>Play JOKER</>;

    let suit: JSX.Element = <></>;
    if (card.suit == "CLUBS") suit = <>♣&#xFE0E;</>;
    if (card.suit == "DIAMONDS") suit = <>♦&#xFE0E;</>;
    if (card.suit == "HEARTS") suit = <>♥&#xFE0E;</>;
    if (card.suit == "SPADES") suit = <>♠&#xFE0E;</>;

    switch (play.length) {
        case 1:
            return (
                <>
                    Play {card.rank}
                    <Text ml={4} fz="16px">
                        {suit}
                    </Text>
                </>
            );
        case 2:
            return <>Play Dub {card.rank}s</>;
        case 3:
            return <>Play Trip {card.rank}s</>;
        case 4:
            return <>Play Quad {card.rank}s</>;
        default:
            return <></>;
    }
}
