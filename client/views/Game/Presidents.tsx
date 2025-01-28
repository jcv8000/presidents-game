import { showErrorNotification } from "@/utils/notifications";
import { store } from "@/utils/store";
import { Card, CARD_VALUES, CARD_RANK } from "types/Game";
import { TypedClientSocket } from "types/SocketIO";
import { useSnapshot } from "valtio";

export default function Presidents(props: { socket: TypedClientSocket }) {
    const { socket } = props;
    const context = useSnapshot(store);

    const my = context.gameState.players.find((p) => p.name == context.name)!;

    const myHand = my.hand
        .map((c) => c)
        .sort((a, b) => (CARD_VALUES[b.rank] > CARD_VALUES[a.rank] ? 1 : -1));

    const isMyTurn = context.gameState.whosTurn?.name == context.name || false;

    const plays = getPossiblePlays(myHand, context.gameState.currentCard as Card[]);

    return (
        <div>
            <table border={1}>
                <tbody>
                    <tr>
                        {context.gameState.players.map((p) => (
                            <td key={p.name}>{p.name}</td>
                        ))}
                    </tr>
                    <tr>
                        {context.gameState.players.map((p) => (
                            <td key={p.name}>{p.hand.length} cards</td>
                        ))}
                    </tr>
                </tbody>
            </table>

            {context.gameState.currentCard.length > 0 && (
                <h1>
                    Current card:{" "}
                    {context.gameState.currentCard[0].rank.repeat(
                        context.gameState.currentCard.length
                    )}
                </h1>
            )}

            {isMyTurn && (
                <div>
                    <h1>
                        {context.gameState.currentCard.length == 0
                            ? "It is your turn to start. Play whatever you want."
                            : "It is your turn."}
                    </h1>

                    {context.gameState.currentCard.length > 0 && (
                        <button
                            style={{ marginBottom: 8 }}
                            onClick={() => {
                                socket.emit("knock", ({ error }) => {
                                    if (error) showErrorNotification({ message: error });
                                });
                            }}
                        >
                            KNOCK
                        </button>
                    )}

                    {plays.map((play, index) => (
                        <div style={{ marginBottom: 8 }} key={index}>
                            <button
                                onClick={() => {
                                    socket.emit("playCards", { cards: play }, ({ error }) => {
                                        if (error) console.log(error);
                                    });
                                }}
                            >
                                {playButtonText(play)}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div>
                <h1>Hand</h1>

                <ol>
                    {myHand.map((card, index) => (
                        <li key={index}>
                            {card.rank} of {card.suit}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

function getPossiblePlays(hand: Card[], currentCard: Card[]): Card[][] {
    let plays: Card[][] = [];

    const map = new Map<CARD_RANK, Card[]>();

    // get card counts
    hand.forEach((c) => {
        const m = map.get(c.rank);

        if (m) m.push(c);
        else map.set(c.rank, [c]);

        plays.push([c]);
    });

    // add multi-card plays
    map.forEach((cards) => {
        if (cards.length >= 2) {
            plays.push([cards[0], cards[1]]);
        }
        if (cards.length >= 3) {
            plays.push([cards[0], cards[1], cards[2]]);
        }
        if (cards.length >= 4) {
            plays.push([cards[0], cards[1], cards[2], cards[3]]);
        }
    });

    // remove invalid plays if they're not starting
    if (currentCard.length > 0) {
        plays = plays.filter(
            (cards) =>
                (cards.length == currentCard.length &&
                    CARD_VALUES[cards[0].rank] >= CARD_VALUES[currentCard[0].rank]) ||
                cards[0].rank == "JOKER"
        );
    }

    plays.sort(
        (a, b) => b.length - a.length || (CARD_VALUES[b[0].rank] > CARD_VALUES[a[0].rank] ? 1 : -1)
    );
    return plays;
}

function playButtonText(play: Card[]) {
    switch (play.length) {
        case 1:
            return (
                <>
                    Play {play[0].rank} of {play[0].suit}
                </>
            );
        case 2:
            return <>Play two {play[0].rank}s</>;
        case 3:
            return <>Play three {play[0].rank}s</>;
        case 4:
            return <>Play all four {play[0].rank}s</>;
        default:
            return <></>;
    }
}
