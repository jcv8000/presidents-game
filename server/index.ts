import { UUID_LENGTH } from "types/constants";
import { CARD_VALUES, GameState, Player, sanitizeGameState } from "types/Game";
import { generateRoomCode } from "./utils/generateRoomCode";
import { setupServer } from "./utils/setupServer";

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

    socket.on("joinGame", ({ code, name, authToken }, callback) => {
        if (typeof authToken !== "string" || authToken.length != UUID_LENGTH) {
            callback({ success: false, error: "Bad auth token" });
            return;
        }

        // Check if game room with this code exists
        const game = games.get(code);
        if (game == undefined) {
            callback({
                success: false,
                error: "Game not found with this code: " + code.toUpperCase()
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
                callback({ success: false, error: "That name is already taken in this room." });
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

    socket.on("sendChat", ({ chat }, callback) => {
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

            game.startFirstRound();

            io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
            callback({ success: true });
        } else {
            callback({ success: false, error: "Game is already in progress." });
        }
    });

    // TODO this all needs re-written to account for knocking, if it reaches around to the player that played the last card, etc.
    socket.on("playCards", ({ cards }, callback) => {
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

        if (game.whosTurn!.authToken != authToken) {
            callback({ success: false, error: "It's not your turn to play." });
            return;
        }

        if (!game.stillHasCards.includes(player)) {
            callback({ success: false, error: "You're already out of cards." });
            return;
        }

        // Check if they have the cards they're trying to play
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (!player.hand.some((c) => c.suit == card.suit && c.rank == card.rank)) {
                callback({
                    success: false,
                    error: "You do not have the card(s) you are trying to play."
                });
                return;
            }
        }

        // remove cards from player's hand
        cards.forEach((c) => {
            player.hand.forEach((handCard) => {
                if (c.rank == handCard.rank && c.suit == handCard.suit) {
                    player.hand.splice(player.hand.indexOf(handCard), 1);
                }
            });
            game.cardsPlayedCount[c.rank] = game.cardsPlayedCount[c.rank] + 1;
        });

        // Actual logic
        let wiped = false;
        const wipe = () => {
            wiped = true;
            game.skipped = 0;
            game.currentCard = [];
            game.resetCardsPlayedCount();
        };

        // Check if card is valid, Joker bypasses all rules
        if (cards.length == 1 && cards[0].rank == "JOKER") {
            // Wipe
            wipe();
        } else {
            if (game.currentCard.length == 0) {
                // Starting, can play whatever
            } else {
                // Check if playing the right amount of cards
                if (cards.length != game.currentCard.length) {
                    callback({
                        success: false,
                        error: "Didn't play the right amount of cards."
                    });
                    return;
                }

                // Check if all cards are equal or better in value
                for (let i = 0; i < game.currentCard.length; i++) {
                    const cc = game.currentCard[i];
                    const c = cards[i];
                    if (CARD_VALUES[c.rank] < CARD_VALUES[cc.rank]) {
                        callback({
                            success: false,
                            error: "Cards do not beat or match current cards."
                        });
                        return;
                    }
                }
            }
        }

        // check if out of cards
        if (player.hand.length == 0) {
            const index = game.stillHasCards.indexOf(player);
            game.stillHasCards.splice(index, 1);

            if (game.players.length >= 4) {
                // Full normal game
                if (game.president == null) game.president = player;
                else if (game.vicePresident == null) game.vicePresident = player;
                else if (game.stillHasCards.length == 1) game.secondToLast = player;
                else if (game.stillHasCards.length == 0) game.loser = player;
            } else {
                // Only have president and loser
                if (game.president == null) game.president = player;
                else if (game.stillHasCards.length == 0) {
                    // ROUND IS OVER!!!!!
                    game.loser = player;
                }
            }

            wipe();
            game.whosTurn = game.stillHasCards[(index + 1) % game.stillHasCards.length];
            game.stillHasCards.splice(index, 1);

            io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
            callback({ success: true });
            return;
        }

        // Wipe? (4th card played at any time) - Same player starts
        if (game.cardsPlayedCount[cards[0].rank] == 4) {
            wipe();
            io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
            callback({ success: true });
            return;
        }

        // Skipping?
        if (game.currentCard.length > 0 && game.currentCard[0].rank == cards[0].rank) {
            const index = game.stillHasCards.indexOf(player);
            game.skipped++;

            for (let i = 1; i < game.skipped + 1; i++) {
                const skippedPlayer = game.stillHasCards[(index + i) % game.stillHasCards.length];
                io.to(roomCode).emit("playerSkipped", skippedPlayer.name);
            }

            game.whosTurn =
                game.stillHasCards[(index + game.skipped + 1) % game.stillHasCards.length];
            game.currentCard = cards;
            game.whoPlayedLastCard = player;

            io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
            callback({ success: true });
            return;
        }

        // Regular card play, no skips or wipes or going-out
        if (!wiped) {
            const index = game.stillHasCards.indexOf(player);
            game.whosTurn = game.stillHasCards[(index + 1) % game.stillHasCards.length];
            game.skipped = 0;
            game.currentCard = cards;
            game.whoPlayedLastCard = player;
        }

        io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
        callback({ success: true });
    });

    socket.on("knock", (callback) => {
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

        if (game.whosTurn!.authToken != authToken) {
            callback({ success: false, error: "It's not your turn to play." });
            return;
        }

        if (!game.stillHasCards.includes(player)) {
            callback({ success: false, error: "You're already out of cards." });
            return;
        }

        const index = game.stillHasCards.indexOf(player);
        const nextPlayer = game.stillHasCards[(index + 1) % game.stillHasCards.length];

        if (nextPlayer == game.whoPlayedLastCard) {
            game.skipped = 0;
            game.currentCard = [];
        }
        game.whosTurn = nextPlayer;

        io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
        callback({ success: true });
    });
});
