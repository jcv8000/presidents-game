import { store } from "@/utils/store";
import { TypedClientSocket } from "types/SocketIO";
import { useSnapshot } from "valtio";
import Chat from "./Chat";
import PlayerList from "./PlayerList";

export default function Lobby(props: { socket: TypedClientSocket }) {
    const { socket } = props;
    const context = useSnapshot(store);

    return (
        <div>
            <h1>Lobby</h1>

            <PlayerList />

            {context.gameState.host?.name == context.name && (
                <div>
                    <h2>You are the host</h2>
                    <button
                        disabled={context.gameState.players.length < 2}
                        onClick={() => {
                            socket.emit("startGame", () => {});
                        }}
                    >
                        Start Game
                    </button>
                </div>
            )}

            <Chat socket={socket} />
        </div>
    );
}
