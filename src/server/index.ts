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

// TODO enforce an api version to connect sockets to make sure client is up to date

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
