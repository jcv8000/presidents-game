import { GameState } from "types/Game";
import { proxy } from "valtio";

type Store = {
    authToken: string;
    name: string;
    code: string;

    gameState: GameState;
};

export const store = proxy<Store>({
    authToken: "",
    name: "",
    code: "",
    gameState: new GameState()
});
