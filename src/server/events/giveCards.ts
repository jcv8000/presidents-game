import { ClientToServerEvents, TypedServerSocket } from "types/SocketIO";
import { sanitize } from "../utils/sanitize";
import { games, io } from "..";
import {
    Card,
    CARD_VALUES,
    cardReferencesEquivalent,
    sanitizeGameState,
    sortCards
} from "types/Game";
import { TIMER_DELAY_SECONDS } from "types/constants";

type Args = Parameters<ClientToServerEvents["giveCards"]>;

export function onGiveCards(socket: TypedServerSocket, [data, callback]: Args) {
    const { authToken, roomCode } = socket.data;
    const { cardIndexes } = sanitize(data);

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
    } else {
        callback({ success: false, error: "Empty card index list." });
        return;
    }

    const newRound = () => {
        game.round++;
        game.currentCard = [];

        game.players.forEach((p) => {
            p.hand = sortCards(p.hand);

            p.hand.forEach((c) => {
                if (cardReferencesEquivalent(c, { rank: "3", suit: "CLUBS" })) game.whosTurn = p;
            });
        });

        game.stillHasCards = Array.from(game.players);
        game.skip = 0;
        game.whoPlayedLastCard = null;
        game.firstPlayOfRound = true;
        game.timer = TIMER_DELAY_SECONDS;

        game.president = null;
        game.vicePresident = null;
        game.secondToLast = null;
        game.loser = null;

        game.presidentAndLoserTraded = false;
        game.vpAnd2ndTraded = false;

        game.stage = "in-game";
    };

    if (game.players.length > 4) {
        // Normal game

        if (player == game.president) {
            if (game.presidentAndLoserTraded) {
                callback({ success: false, error: "President and loser already traded." });
                return;
            }

            if (cards.length != 2) {
                callback({ success: false, error: "You have to give 2 cards." });
                return;
            }

            // Remove president's given cards
            cards.forEach((card) => {
                const index = player.hand.findIndex((c) => cardReferencesEquivalent(card, c));
                player.hand.splice(index, 1);
            });

            // Take loser's top 2 cards
            const loserHandSorted = game
                .loser!.hand.map((c) => c)
                .sort((a, b) => (CARD_VALUES[b.rank] > CARD_VALUES[a.rank] ? 1 : -1));
            const loserCards: Card[] = [];
            const loserCardIndex1 = game.loser!.hand.findIndex((c) =>
                cardReferencesEquivalent(loserHandSorted[0], c)
            );
            const loserCardIndex2 = game.loser!.hand.findIndex((c) =>
                cardReferencesEquivalent(loserHandSorted[1], c)
            );

            loserCards.push(loserHandSorted[0], loserHandSorted[1]);
            game.loser!.hand.splice(loserCardIndex1, 1);
            game.loser!.hand.splice(loserCardIndex2, 1);

            // Give loser the presidents cards
            game.loser!.hand.push(...cards);

            // Give president the loser's cards
            game.president.hand.push(...loserCards);

            game.presidentAndLoserTraded = true;
        } else if (player == game.vicePresident) {
            if (game.vpAnd2ndTraded) {
                callback({ success: false, error: "President and loser already traded." });
                return;
            }

            if (cards.length != 1) {
                callback({ success: false, error: "You have to give 1 card." });
                return;
            }

            // Remove VP's given cards
            cards.forEach((card) => {
                const index = player.hand.findIndex((c) => cardReferencesEquivalent(card, c));
                player.hand.splice(index, 1);
            });

            // Take 2nd loser's top 1 cards
            const loserHandSorted = game
                .secondToLast!.hand.map((c) => c)
                .sort((a, b) => (CARD_VALUES[b.rank] > CARD_VALUES[a.rank] ? 1 : -1));
            const loserCards: Card[] = [];
            const loserCardIndex1 = game.secondToLast!.hand.findIndex((c) =>
                cardReferencesEquivalent(loserHandSorted[0], c)
            );

            loserCards.push(loserHandSorted[0]);
            game.secondToLast!.hand.splice(loserCardIndex1, 1);

            // Give loser the presidents cards
            game.secondToLast!.hand.push(...cards);

            // Give president the loser's cards
            game.vicePresident.hand.push(...loserCards);

            game.vpAnd2ndTraded = true;
        }
    } else {
        // Small game
        if (player == game.president) {
            if (game.presidentAndLoserTraded) {
                callback({ success: false, error: "President and loser already traded." });
                return;
            }

            if (cards.length != 1) {
                callback({ success: false, error: "You have to give 1 card." });
                return;
            }

            // Remove presidents's given card
            cards.forEach((card) => {
                const index = player.hand.findIndex((c) => cardReferencesEquivalent(card, c));
                player.hand.splice(index, 1);
            });

            // Take 2nd loser's top 1 cards
            const loserHandSorted = game
                .loser!.hand.map((c) => c)
                .sort((a, b) => (CARD_VALUES[b.rank] > CARD_VALUES[a.rank] ? 1 : -1));
            const loserCards: Card[] = [];
            const loserCardIndex1 = game.loser!.hand.findIndex((c) =>
                cardReferencesEquivalent(loserHandSorted[0], c)
            );

            loserCards.push(loserHandSorted[0]);
            game.loser!.hand.splice(loserCardIndex1, 1);

            // Give loser the presidents cards
            game.loser!.hand.push(...cards);

            // Give president the loser's cards
            game.president.hand.push(...loserCards);

            game.presidentAndLoserTraded = true;
        }
    }

    // Check if all trades done
    if (game.players.length > 4) {
        // Normal game
        if (game.presidentAndLoserTraded && game.vpAnd2ndTraded) {
            newRound();
        }
    } else {
        // Small game
        if (game.presidentAndLoserTraded) {
            newRound();
        }
    }

    io.to(roomCode).emit("gameStateUpdate", sanitizeGameState(game)); // includes sender
    callback({ success: true });
}
