import { connect } from "socket.io-client";
import { CARD_RANK, CARD_VALUES, GameState } from "types/Game";
import { TypedClientSocket } from "types/SocketIO";
import { v4 as uuid } from "uuid";

if (process.argv.length != 4) process.exit(1);

const url = process.argv[2];
const roomCode = process.argv[3];
const authToken = uuid();
const name = generateName();

const socket: TypedClientSocket = connect(url, { autoConnect: false, transports: ["polling"] });

let game: GameState = new GameState();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function playCards(): Promise<boolean> {
    const my = game.players.find((p) => p.name == name)!;

    console.log("Hand: " + my.hand.map((c) => c.rank).join(","));

    const countMap = new Map<CARD_RANK, number>();
    my.hand.forEach((card) => {
        if (!countMap.has(card.rank)) countMap.set(card.rank, 0);

        countMap.set(card.rank, countMap.get(card.rank)! + 1);
    });

    if (game.firstPlayOfRound) {
        const threeOfClubs = my.hand.find((c) => c.rank == "3" && c.suit == "CLUBS")!;
        const index = my.hand.indexOf(threeOfClubs);

        console.log("Playing " + threeOfClubs.rank);
        const resp = await socket.emitWithAck("playCards", { cardIndexes: index.toString() });

        if (resp.success) return true;
        else {
            console.log("Invalid play: " + resp.error);
            return false;
        }
    }

    if (game.currentCard.length == 0) {
        // I start, play whatever

        console.log("Playing " + my.hand[0].rank);
        const resp = await socket.emitWithAck("playCards", { cardIndexes: "0" });

        if (resp.success) return true;
        else {
            console.log("Invalid play: " + resp.error);
            return false;
        }
    }

    const numNeeded = game.currentCard.length;
    for (const [rank, value] of countMap) {
        if (value >= numNeeded && CARD_VALUES[rank] >= CARD_VALUES[game.currentCard[0].rank]) {
            // play this rank.
            const cards = my.hand.filter((c) => c.rank == rank);
            const indexes: number[] = [];
            cards.forEach((c) => {
                if (indexes.length < numNeeded) indexes.push(my.hand.indexOf(c));
            });

            console.log("Playing " + indexes.map((i) => my.hand[i].rank).join(","));

            const resp = await socket.emitWithAck("playCards", {
                cardIndexes: indexes.join(",")
            });

            if (resp.success) return true;
            else {
                console.log("Invalid play: " + resp.error);
                return false;
            }
        }
    }

    // play joker if i have one
    if (my.hand.filter((c) => c.rank == "JOKER").length > 0) {
        const index = my.hand.findIndex((c) => c.rank == "JOKER");
        console.log("Playing JOKER");

        const resp = await socket.emitWithAck("playCards", {
            cardIndexes: index.toString()
        });

        if (resp.success) return true;
        else {
            console.log("Invalid play: " + resp.error);
            return false;
        }
    }

    console.log("Knocking");

    const resp = await socket.emitWithAck("playCards", {
        cardIndexes: ""
    });
    if (resp.success) return true;
    else {
        console.log("Invalid play: " + resp.error);
        return false;
    }
}

socket.on("connect", () => {
    console.log("Connected!");

    socket.emit(
        "joinGame",
        {
            name: name,
            code: roomCode.toLowerCase(),
            authToken: authToken,
            clientApiHash: Bun.env.VITE_CLIENT_API_HASH
        },
        ({ success, error }) => {
            if (!success) {
                console.log(error);
                socket.disconnect();
                process.exit(1);
            }
        }
    );

    socket.on("gameStateUpdate", async (s) => {
        game = s;
        const my = game.players.find((p) => p.name == name)!;

        if (game.whosTurn?.name == my.name) {
            await delay(600);
            await playCards();
        }
    });
});
console.log(`Connecting to ${url} to room code ${roomCode}...`);

socket.connect();

function generateName() {
    const chars = "abcdefghijklmnopqrstuvwxyz1234567890";

    const getChar = () => {
        return chars.charAt(Math.floor(Math.random() * chars.length));
    };

    return "greedyAI " + getChar() + getChar() + getChar();
}
