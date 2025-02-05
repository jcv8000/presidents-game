import { store } from "@/utils/store";
import { useSnapshot } from "valtio";

export default function PlayerList() {
    const context = useSnapshot(store);

    return (
        <div>
            <p>Players:</p>
            <ul>
                {context.gameState.players.map((p) => (
                    <li key={p.name}>
                        {p.name}: {p.connected ? "Connected" : "Disconnected"}
                    </li>
                ))}
            </ul>
        </div>
    );
}
