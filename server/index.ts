import { ROOM_SIZE_LIMIT, UUID_LENGTH } from "types/constants";
import {
    Card,
    CARD_RANK,
    CARD_VALUES,
    cardReferencesEquivalent,
    GameState,
    Player,
    sanitizeGameState
} from "types/Game";
import { generateRoomCode } from "./utils/generateRoomCode";
import { setupServer } from "./utils/setupServer";
import { sanitize } from "./utils/sanitize";

const io = setupServer();
const games = new Map<string, GameState>();

io.on("connection", (socket) => {
    socket.on("disconnecting", () => {
        const { roomCode, authToken } = socket.data;

        const game = games.get(roomCode);
        if (game == undefined) return;

        const player = game.players.find((p) => p.authToken == authToken);
        if (player == undefined) return;

        player.connected = false;
        game.chat.push({ message: `${player.name} disconnected.`, color: "red" });

        io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game));
    });

    socket.on("createNewGame", (callback) => {
        let code = generateRoomCode();

        while (games.has(code)) {
            // Code already in use
            code = generateRoomCode();
        }

        const game = new GameState();
        games.set(code, game);

        callback({ success: true, code: code });
    });

    socket.on("joinGame", (data, callback) => {
        const { code, name, authToken } = sanitize(data);
        if (typeof authToken !== "string" || authToken.length != UUID_LENGTH) {
            callback({ success: false, error: "Bad auth token" });
            return;
        }

        // Check if game room with this code exists
        const game = games.get(code);
        if (game == undefined) {
            callback({
                success: false,
                error: "Game room not found: " + code.toUpperCase()
            });
            return;
        }

        // TODO see if this is still necessary
        if (process.env.NODE_ENV !== "development") {
            if (socket.rooms.size > 1) {
                callback({ success: false, error: "WebSocket is already in a room." });
                return;
            }
        }

        // Check if this name is already taken by someone else (different auth token)
        const nameMatch = game.players.find((p) => p.name == name);
        if (nameMatch) {
            if (nameMatch.authToken != authToken) {
                callback({ success: false, error: "That name is already taken." });
                return;
            }
        }

        // Check if existing player reconnecting
        const authMatch = game.players.find((p) => p.authToken == authToken);
        if (authMatch) {
            // Name might have changed
            if (authMatch.name != name) {
                game.chat.push({
                    message: `${authMatch.name} rejoined as ${name}.`,
                    color: "yellow"
                });
                authMatch.name = name;
            } else {
                game.chat.push({ message: `${name} reconnected.`, color: "yellow" });
            }

            authMatch.connected = true;
        } else {
            // New player connection

            if (game.players.length >= ROOM_SIZE_LIMIT) {
                callback({ success: false, error: "Game is full." });
                return;
            }

            if (game.stage == "lobby") {
                const player = new Player(name, authToken);
                game.players.push(player);
                game.chat.push({ message: `${name} joined the game!`, color: "yellow" });

                if (game.players.length == 1) game.host = player;
            } else {
                callback({ success: false, error: "Game already in progress." });
                return;
            }
        }

        socket.join(code);
        socket.data.authToken = authToken;
        socket.data.roomCode = code;

        callback({ success: true });
        io.to(code).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
    });

    socket.on("sendChat", (data, callback) => {
        const { authToken, roomCode } = socket.data;
        const { chat } = sanitize(data);

        const game = games.get(roomCode);
        if (game == undefined) {
            callback({ success: false, error: "Room code not found." });
            return;
        }

        const player = game.players.find((p) => p.authToken == authToken);
        if (player == undefined) {
            callback({ success: false, error: "Player is not in this room." });
            return;
        }

        if (game.players.length < 2) {
            callback({ success: false, error: "Not enough players." });
            return;
        }

        if (game.players.length > ROOM_SIZE_LIMIT) {
            callback({ success: false, error: "Too many players." });
            return;
        }

        game.chat.push({ message: `${player.name}: ${chat}` });

        io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
        callback({ success: true });
    });

    socket.on("startGame", (callback) => {
        const { authToken, roomCode } = socket.data;

        const game = games.get(roomCode);
        if (game == undefined) {
            callback({ success: false, error: "Room code not found." });
            return;
        }

        const player = game.players.find((p) => p.authToken == authToken);
        if (player == undefined) {
            callback({ success: false, error: "Player is not in this room." });
            return;
        }

        if (game.players.length < 2) {
            callback({ success: false, error: "Not enough players to start." });
            return;
        }

        if (game.stage == "lobby") {
            game.stage = "in-game";
            game.chat.push({ message: `Game is starting`, color: "green" });

            // TODO kick disconnected players on start?
            game.players = game.players.filter((p) => p.connected == true);

            game.startRound();

            io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
            callback({ success: true });
        } else {
            callback({ success: false, error: "Game is already in progress." });
        }
    });

    // TODO this all needs re-written to account for knocking, if it reaches around to the player that played the last card, etc.
    socket.on("playCards", (data, callback) => {
        const { cardIndexes } = sanitize(data);
        const { authToken, roomCode } = socket.data;

        const game = games.get(roomCode);
        if (game == undefined) {
            callback({ success: false, error: "Room code not found." });
            return;
        }

        const player = game.players.find((p) => p.authToken == authToken);
        if (player == undefined) {
            callback({ success: false, error: "Player is not in this room." });
            return;
        }

        // Check validity of cardIndexes string
        const allowedChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ","];
        for (let i = 0; i < cardIndexes.length; i++) {
            if (!allowedChars.includes(cardIndexes[i])) {
                callback({ success: false, error: "Bad card index list." });
                return;
            }
        }

        //
        // LEGALITY CHECKING
        //

        // Check if they're already out of cards
        if (player.hand.length == 0) {
            callback({ success: false, error: "You're already out of cards." });
            return;
        }

        // Check if it's actually their turn
        if (game.whosTurn!.authToken != authToken) {
            callback({ success: false, error: "It's not your turn to play." });
            return;
        }

        // Get cards from supplied indexes
        const cards: Card[] = [];
        if (cardIndexes != "") {
            const indexes = cardIndexes.split(",");
            indexes.forEach((i) => {
                const index = parseInt(i);
                if (index < 0 || index > player.hand.length) {
                    callback({ success: false, error: "Bad card index." });
                    return;
                }
                cards.push(player.hand[parseInt(i)]);
            });
        }
        for (let i = 1; i < cards.length; i++) {
            const [c1, c2] = [cards[i - 1], cards[i]];
            if (c1.rank != c2.rank) {
                callback({ success: false, error: "Tried to play different card ranks." });
                return;
            }
        }

        if (game.currentCard.length > 0 && cards.length > 0 && cards[0].rank != "JOKER") {
            // Check if they're playing the right amount of cards
            if (cards.length != game.currentCard.length) {
                callback({ success: false, error: "Didn't play the right amount of cards." });
                return;
            }

            // Check if all cards are equal or higher in value
            for (let i = 0; i < game.currentCard.length; i++) {
                const cc = game.currentCard[i];
                const c = cards[i];
                if (CARD_VALUES[c.rank] < CARD_VALUES[cc.rank]) {
                    callback({
                        success: false,
                        error: "Cards do not match or beat current cards."
                    });
                    return;
                }
            }
        }

        //
        // ACTUAL GAMEPLAY LOGIC, PLAY IS LEGAL
        //

        const wipe = () => {
            game.currentCard = [];
            game.skip = 0;
            game.whoPlayedLastCard = null;

            sendNotification(`${game.whosTurn?.name} wiped.`);
        };

        const goNextPlayer = (opts?: { removeCurrentPlayer: boolean }) => {
            const index = game.stillHasCards.indexOf(player);
            game.whosTurn = game.stillHasCards[(index + 1) % game.stillHasCards.length];

            if (opts && opts.removeCurrentPlayer === true) game.stillHasCards.splice(index, 1);
        };

        const sendGameUpdate = () => {
            io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
            callback({ success: true });
        };

        const sendNotification = (message: string) => {
            io.to(roomCode).emit("notification", message); // includes sender
        };

        // Remove cards from player's hand
        cards.forEach((c) => {
            player.hand.forEach((handCard) => {
                if (cardReferencesEquivalent(c, handCard)) {
                    player.hand.splice(player.hand.indexOf(handCard), 1);
                }
            });
        });

        game.firstPlayOfRound = false;

        // Check if player is out of cards
        if (player.hand.length == 0) {
            if (game.stillHasCards.length == 1) {
                // GAME IS OVER!!!
                game.loser = player;
                sendNotification(`${player.name} lost the round.`);

                game.stage = "ended";
            } else {
                wipe();
                goNextPlayer({ removeCurrentPlayer: true });

                if (game.president == null) {
                    game.president = player;
                    sendNotification(`${player.name} is the President.`);
                } else if (game.vicePresident == null) {
                    game.vicePresident = player;
                    sendNotification(`${player.name} is the VP.`);
                } else if (game.secondToLast == null) {
                    game.secondToLast = player;
                    sendNotification(`${player.name} got 2nd to last.`);
                }
            }

            sendGameUpdate();
            return;
        }

        // Check if Joker
        if (cards.length > 0 && cards[0].rank == "JOKER") {
            wipe();
            sendGameUpdate();
            return;
        }

        // Check if playing all 4 cards of rank
        if (game.currentCard.length == 0 && cards.length == 4) {
            // WIPE
            wipe();
            sendGameUpdate();
            return;
        }

        // Regular play
        if (cards.length > 0) {
            // Check for skip / wipe
            let skipping = false;
            if (game.currentCard.length == 1) {
                // Single cards
                if (cards[0].rank == game.currentCard[0].rank) {
                    skipping = true;
                    game.skip++;
                    if (game.skip == 3) {
                        // WIPE
                        wipe();
                        sendGameUpdate();
                        return;
                    }

                    const index = game.stillHasCards.indexOf(player);

                    for (let i = 1; i <= game.skip; i++) {
                        const skippedPlayer =
                            game.stillHasCards[(index + i) % game.stillHasCards.length];
                        sendNotification(`${skippedPlayer.name} was skipped!`);
                    }

                    game.whosTurn =
                        game.stillHasCards[(index + game.skip + 1) % game.stillHasCards.length];
                }
            } else if (game.currentCard.length == 2) {
                if (cards[0].rank == game.currentCard[0].rank) {
                    wipe();
                    sendGameUpdate();
                    return;
                }
            }

            game.whoPlayedLastCard = player;
            game.currentCard = cards;
            if (!skipping) {
                game.skip = 0;
                goNextPlayer();
            }
        }

        // Knock
        if (cards.length == 0) {
            goNextPlayer();
        }

        // Check if next player is the one who played the last card
        if (game.whosTurn == game.whoPlayedLastCard) {
            sendNotification(`Turn got back to ${game.whosTurn?.name}.`);
            wipe();
        }

        sendGameUpdate();
    });
});
