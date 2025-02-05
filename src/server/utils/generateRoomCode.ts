import { ROOM_CODE_ALPHABET, ROOM_CODE_SIZE } from "types/constants";

// min is inclusive, max is exclusive
function getRandomInt(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function generateRoomCode() {
    let ans = "";

    for (let i = 0; i < ROOM_CODE_SIZE; i++) {
        const x = getRandomInt(0, ROOM_CODE_ALPHABET.length);
        ans += ROOM_CODE_ALPHABET.charAt(x);
    }

    return ans;
}
