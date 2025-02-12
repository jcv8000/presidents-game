import { ClientToServerEvents, TypedServerSocket } from "types/SocketIO";
import { sanitize } from "../utils/sanitize";
import { games, io } from "..";
import { Card, CARD_VALUES, cardReferencesEquivalent, sanitizeGameState } from "types/Game";
import { setIntervalWithEnd } from "../utils/setIntervalWithEnd";

type Args = Parameters<ClientToServerEvents["playCards"]>;

export function onPlayCards(socket: TypedServerSocket, [data, callback]: Args) {
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

    if (game.firstPlayOfRound) {
        if (cards.length != 1) {
            callback({
                success: false,
                error: "Have to start with 3 of clubs."
            });
            return;
        } else if (cards.length == 1) {
            if (cards[0].rank != "3" || cards[0].suit != "CLUBS") {
                callback({
                    success: false,
                    error: "Have to start with 3 of clubs."
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

    const roundOver = () => {
        game.whosTurn = null;
        game.players.forEach((p) => (p.hand = []));
        game.stage = "round-over";

        setIntervalWithEnd({
            func: () => {
                game.timer--;
                sendGameUpdate();
            },
            conditionToEnd: () => game.timer <= 0,
            interval: 1000,
            callback: () => {
                game.stage = "trading-cards";
                game.dealCards();
                sendGameUpdate();
            }
        });
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
        if (game.stillHasCards.length == 2) {
            // ROUND IS OVER!!!
            if (game.players.length > 4) {
                game.secondToLast = player;
                sendNotification(`${player.name} got 2nd to last.`);
            } else if (game.players.length == 2) {
                game.president = player;
                sendNotification(`${player.name} is the President.`);
            }
            const index = game.stillHasCards.indexOf(player);
            game.stillHasCards.splice(index, 1);
            game.loser = game.stillHasCards[0];
            sendNotification(`${game.loser.name} lost the round.`);

            roundOver();
        } else {
            if (game.players.length > 4) {
                if (game.stillHasCards.length == game.players.length) {
                    game.president = player;
                    sendNotification(`${player.name} is the President.`);
                } else if (game.stillHasCards.length == game.players.length - 1) {
                    game.vicePresident = player;
                    sendNotification(`${player.name} is the VP.`);
                } else if (game.stillHasCards.length == 2) {
                    game.secondToLast = player;
                    sendNotification(`${player.name} got 2nd to last.`);
                }
            } else {
                if (game.stillHasCards.length == game.players.length) {
                    game.president = player;
                    sendNotification(`${player.name} is the President.`);
                }
            }

            wipe();
            goNextPlayer({ removeCurrentPlayer: true });
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
}
