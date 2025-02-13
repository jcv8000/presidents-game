import { GameState } from "types/Game";
import { setupServer } from "./utils/setupServer";
import { onDisconnecting } from "./events/disconnecting";
import { onCreateNewGame } from "./events/createNewGame";
import { onJoinGame } from "./events/joinGame";
import { onSendChat } from "./events/sendChat";
import { onStartGame } from "./events/startGame";
import { onPlayCards } from "./events/playCards";
import { onGiveCards } from "./events/giveCards";

export const io = setupServer();
export const games = new Map<string, GameState>();

io.on("connection", (socket) => {
    socket.on("disconnecting", (reason, desc) =>
        onDisconnecting(socket, { reason: reason, description: desc })
    );

    socket.on("createNewGame", (callback) => onCreateNewGame(socket, [callback]));

    socket.on("joinGame", (data, callback) => onJoinGame(socket, [data, callback]));

    socket.on("sendChat", (data, callback) => onSendChat(socket, [data, callback]));

    socket.on("startGame", (data, callback) => onStartGame(socket, [data, callback]));

    socket.on("playCards", (data, callback) => onPlayCards(socket, [data, callback]));

    socket.on("giveCards", (data, callback) => onGiveCards(socket, [data, callback]));
});

/**
 * Clean up empty games
 *
 * Add all games with 0 players to the chopping block,
 * then on the next interval it will double-check that
 * there are still 0 players in the game before destroying.
 */
const choppingBlock = new Set<string>();
setInterval(
    () => {
        const gameIsEmpty = (g: GameState) =>
            g.players.filter((p) => p.connected === true).length === 0;

        for (const code of choppingBlock) {
            if (games.has(code)) {
                const g = games.get(code)!;

                if (gameIsEmpty(g)) {
                    games.delete(code);
                    console.log(`Destroying lobby: ${code.toUpperCase()}`);
                } else {
                    choppingBlock.delete(code);
                }
            }
        }

        for (const [code, g] of games) {
            if (gameIsEmpty(g)) {
                choppingBlock.add(code);
                console.log(`${code.toUpperCase()} added to chopping block.`);
            }
        }
    },
    5 * 60 * 1_000
);
