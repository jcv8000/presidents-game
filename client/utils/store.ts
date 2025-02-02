import { GameState } from "types/Game";
import { proxy } from "valtio";

declare module "valtio" {
    function useSnapshot<T extends object>(p: T): T;
}

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
