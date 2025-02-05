import { showErrorNotification } from "@/utils/notifications";
import { store } from "@/utils/store";
import { useState } from "react";
import { TypedClientSocket } from "types/SocketIO";
import { useSnapshot } from "valtio";

export default function Chat(props: { socket: TypedClientSocket }) {
    const { socket } = props;
    const context = useSnapshot(store);
    const [chatInputText, setChatInputText] = useState("");

    function submitChat() {
        if (chatInputText != "")
            socket.emit("sendChat", { chat: chatInputText }, ({ success, error }) => {
                if (success) setChatInputText("");
                else showErrorNotification({ message: error });
            });
    }

    return (
        <div>
            <h1>Chat</h1>
            <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.currentTarget.value)}
                onKeyUp={(e) => {
                    if (e.key == "Enter") {
                        submitChat();
                        return true;
                    }
                }}
            />
            <div style={{ whiteSpace: "pre" }}>
                {context.gameState.chat.map((c, index) => (
                    <p key={index} style={{ color: c.color }}>
                        {c.message}
                    </p>
                ))}
            </div>
        </div>
    );
}
