import classes from "./Presidents.module.css";

// prettier-ignore
import { Button, Center, Container, Flex, Stack, Text, Title } from "@mantine/core";
import { showErrorNotification } from "@/utils/notifications";
import { store } from "@/utils/store";
import { Card, CARD_VALUES, CARD_RANK, cardReferencesEquivalent } from "types/Game";
import { TypedClientSocket } from "types/SocketIO";
import { useSnapshot } from "valtio";
import { CardsDisplay } from "@/components";
import { JSX } from "react";

export default function Presidents(props: { socket: TypedClientSocket }) {
    const { socket } = props;
    const context = useSnapshot(store);

    const state = context.gameState;
    const players = state.players;

    const my = state.players.find((p) => p.name == context.name)!;

    const myHand = my.hand
        .map((c) => c)
        .sort((a, b) => (CARD_VALUES[b.rank] > CARD_VALUES[a.rank] ? 1 : -1));

    const isMyTurn = state.whosTurn?.name == context.name || false;

    const plays = getPossiblePlays(myHand, state.currentCard, state.firstPlayOfRound);

    function mapPlays(plays: Card[][], title = "") {
        if (plays.length == 0) return <></>;
        return (
            <div style={{ width: "100%" }}>
                <Center>
                    <Text size="xs" c="dimmed">
                        {title}
                    </Text>
                </Center>
                <Flex className={classes.playList} justify="center" align="center" wrap="wrap">
                    {plays.map((play) => (
                        <Button
                            size="compact-xl"
                            m="xs"
                            onClick={() => {
                                const indexes: number[] = [];
                                play.forEach((card) => {
                                    const index = my.hand.findIndex((v) =>
                                        cardReferencesEquivalent(card, v)
                                    );
                                    indexes.push(index);
                                });
                                socket.emit(
                                    "playCards",
                                    { cardIndexes: indexes.join(",") },
                                    ({ error }) => {
                                        if (error) console.log(error);
                                    }
                                );
                            }}
                        >
                            {playButtonText(play)}
                        </Button>
                    ))}
                </Flex>
            </div>
        );
    }

    return (
        <Container size="md">
            <Stack align="center">
                <table className={classes.table}>
                    <tbody>
                        <tr>
                            {players.map((p) => (
                                <td key={p.name}>{p.name}</td>
                            ))}
                        </tr>
                        <tr>
                            {players.map((p) => {
                                let text = p.hand.length.toString();
                                if (state.president?.name == p.name) text = "PRESIDENT";
                                else if (state.vicePresident?.name == p.name) text = "VICE PRES";
                                else if (state.secondToLast?.name == p.name) text = "2nd LAST";
                                else if (state.loser?.name == p.name) text = "LOSER";
                                else if (p.hand.length == 0) text = "out";
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

                        {mapPlays(plays.singleCardPlays, "Singles")}
                        {mapPlays(plays.twoCardPlays, "Doubles")}
                        {mapPlays(plays.threeCardPlays, "Triples")}
                        {mapPlays(plays.fourCardPlays, "Quads")}
                        {mapPlays(plays.jokerPlays, "Jokers")}

                        {state.currentCard.length > 0 && (
                            <Button
                                color="red"
                                size="compact-xl"
                                onClick={() => {
                                    // Knock
                                    socket.emit("playCards", { cardIndexes: "" }, ({ error }) => {
                                        if (error) showErrorNotification({ message: error });
                                    });
                                }}
                            >
                                KNOCK
                            </Button>
                        )}
                    </>
                )}

                {!isMyTurn && <Title order={2}>{state.whosTurn?.name}'s turn</Title>}

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

function getPossiblePlays(
    hand: Card[],
    currentCard: Card[],
    firstPlayOfRound: boolean
): {
    singleCardPlays: Card[][];
    twoCardPlays: Card[][];
    threeCardPlays: Card[][];
    fourCardPlays: Card[][];
    jokerPlays: Card[][];
} {
    let singleCardPlays: Card[][] = [];
    let twoCardPlays: Card[][] = [];
    let threeCardPlays: Card[][] = [];
    let fourCardPlays: Card[][] = [];
    let jokerPlays: Card[][] = [];

    const map = new Map<CARD_RANK, Card[]>();

    // get card counts
    hand.forEach((c) => {
        if (firstPlayOfRound) {
            if (c.rank == "3") {
                const m = map.get(c.rank);

                if (m) m.push(c);
                else map.set(c.rank, [c]);

                if (c.suit == "CLUBS") singleCardPlays.push([c]);
            }
        } else {
            const m = map.get(c.rank);

            if (m) m.push(c);
            else map.set(c.rank, [c]);

            if (c.rank == "JOKER") {
                jokerPlays.push([c]);
            } else {
                singleCardPlays.push([c]);
            }
        }
    });

    // add multi-card plays
    map.forEach((cards) => {
        if (cards[0].rank != "JOKER") {
            if (cards.length >= 2) {
                twoCardPlays.push([cards[0], cards[1]]);
            }
            if (cards.length >= 3) {
                threeCardPlays.push([cards[0], cards[1], cards[2]]);
            }
            if (cards.length >= 4) {
                fourCardPlays.push([cards[0], cards[1], cards[2], cards[3]]);
            }
        }
    });

    // remove invalid plays if they're not starting
    if (currentCard.length > 0) {
        function filter(cards: Card[]) {
            return (
                (cards.length == currentCard.length &&
                    CARD_VALUES[cards[0].rank] >= CARD_VALUES[currentCard[0].rank]) ||
                cards[0].rank == "JOKER"
            );
        }

        singleCardPlays = singleCardPlays.filter(filter);
        twoCardPlays = twoCardPlays.filter(filter);
        threeCardPlays = threeCardPlays.filter(filter);
        fourCardPlays = fourCardPlays.filter(filter);
        jokerPlays = jokerPlays.filter(filter);
    }

    // plays.sort(
    //     (a, b) =>
    //         (a[0].rank == "JOKER" ? -1 : 0) ||
    //         b.length - a.length ||
    //         (CARD_VALUES[b[0].rank] > CARD_VALUES[a[0].rank] ? 1 : -1)
    // );

    function sort(a: Card[], b: Card[]) {
        return (
            (a[0].rank == "JOKER" ? 1 : 0) ||
            a.length - b.length ||
            (CARD_VALUES[a[0].rank] > CARD_VALUES[b[0].rank] ? 1 : -1)
        );
    }

    singleCardPlays.sort(sort);
    twoCardPlays.sort(sort);
    threeCardPlays.sort(sort);
    fourCardPlays.sort(sort);
    jokerPlays.sort(sort);

    return {
        singleCardPlays: singleCardPlays,
        twoCardPlays: twoCardPlays,
        threeCardPlays: threeCardPlays,
        fourCardPlays: fourCardPlays,
        jokerPlays: jokerPlays
    };
}

function playButtonText(play: Card[]) {
    const card = play[0];
    if (card.rank == "JOKER") return <>JOKER</>;

    let suit: JSX.Element = <></>;
    if (card.suit == "CLUBS") suit = <>♣&#xFE0E;</>;
    if (card.suit == "DIAMONDS") suit = <>♦&#xFE0E;</>;
    if (card.suit == "HEARTS") suit = <>♥&#xFE0E;</>;
    if (card.suit == "SPADES") suit = <>♠&#xFE0E;</>;

    switch (play.length) {
        case 1:
            return (
                <>
                    {card.rank}
                    <Text ml={4} fz="16px">
                        {suit}
                    </Text>
                </>
            );
        case 2:
            return <>Dub {card.rank}s</>;
        case 3:
            return <>Trip {card.rank}s</>;
        case 4:
            return <>Quad {card.rank}s</>;
        default:
            return <></>;
    }
}
