// prettier-ignore
import { Button, Center, Container, Flex, Group, Loader, Overlay, TextInput } from "@mantine/core";

import { getCookie, setCookie } from "@/utils/cookies";
import { showErrorNotification } from "@/utils/notifications";
import { socket } from "@/utils/socket";
import { store } from "@/utils/store";
import { notifications } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ARTIFICIAL_CONNECT_DELAY, UUID_LENGTH } from "types/constants";
import { v4 as uuid } from "uuid";
import { useSnapshot } from "valtio";

export default function Game() {
    const { code } = useParams();
    const navigate = useNavigate();
    const context = useSnapshot(store);

    const [text, setText] = useState("");
    const [joinedGame, setJoinedGame] = useState(false);
    const [connected, setConnected] = useState(false);

    const viewport = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!code) return;
        if (!navigate) return;

        setCookie("code", code);

        const name = getCookie("name");
        if (name == undefined || name == "") {
            showErrorNotification({ message: "Enter a name." });
            navigate("/");
            return;
        }

        let authToken = getCookie("authToken");
        if (authToken == undefined || authToken.length != UUID_LENGTH) {
            authToken = uuid();
            setCookie("authToken", authToken);
            store.authToken = authToken;
        }

        socket.on("connect", () => {
            socket.emit(
                "joinGame",
                { code: code, name: name, authToken: authToken },
                ({ success, error }) => {
                    setTimeout(() => {
                        if (success) {
                            store.name = name;
                            store.code = code;

                            setJoinedGame(true);
                            setConnected(true);

                            notifications.clean();
                        } else {
                            navigate("/");
                            showErrorNotification({ message: error });
                        }
                    }, ARTIFICIAL_CONNECT_DELAY);
                }
            );
        });
        socket.on("disconnect", (reason) => {
            if (socket.active) {
                // Temporary disconnection
                setConnected(false);
            } else {
                navigate("/");
                showErrorNotification({ title: "Disconnected", message: reason });
            }
        });

        socket.on("gameStateUpdate", (state) => {
            store.gameState = state;

            setTimeout(() => {
                if (viewport.current != null)
                    viewport.current.scrollTo({ top: viewport.current.scrollHeight });
            }, 2);
        });

        socket.connect();

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("gameStateUpdate");
            socket.disconnect();
        };
    }, [code, navigate]);

    function submitChat() {
        if (text != "")
            socket.emit("sendChat", { chat: text }, ({ success, error }) => {
                if (success) setText("");
                else showErrorNotification({ message: error });
            });
    }

    function leaveGame() {
        navigate("/");
    }

    if (!joinedGame)
        return (
            <Container fluid h="100vh">
                <Overlay backgroundOpacity={0}>
                    <Center h="100%">
                        <Loader type="oval" />
                    </Center>
                </Overlay>
            </Container>
        );

    return (
        <Container fluid h="100vh" p={0}>
            {!connected && (
                <Overlay backgroundOpacity={0.7}>
                    <Center h="100%">
                        <Loader type="oval" />
                    </Center>
                </Overlay>
            )}
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div
                    style={{
                        height: "48px",
                        borderBottom: "2px solid var(--mantine-color-dark-5)"
                    }}
                >
                    <Group justify="space-between" h="100%">
                        Game Code: {context.code.toUpperCase()}
                        {/* TODO add an actual "leave-game" function to tell people you're actually done */}
                        <Button color="red" size="xs" onClick={leaveGame}>
                            Leave Game
                        </Button>
                    </Group>
                </div>
                <div style={{ flex: 1 }}>
                    <Flex>
                        <div
                            style={{
                                width: "300px",
                                borderRight: "2px solid var(--mantine-color-dark-5)",
                                maxHeight: "calc(100vh - 96px)",
                                overflow: "auto"
                            }}
                        >
                            <Center>Players</Center>
                            {context.gameState.players.map((p) => (
                                <div key={p.name}>
                                    <span style={{ color: p.connected ? "green" : "red" }}>
                                        {p.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                flex: 1,
                                height: "calc(100vh - 96px)",
                                overflow: "auto"
                            }}
                            ref={viewport}
                        >
                            {context.gameState.chat.map((chat, index) => (
                                <p key={index} style={{ color: chat.color }}>
                                    {chat.message}
                                </p>
                            ))}
                        </div>
                    </Flex>
                </div>

                <div style={{ height: "48px", borderTop: "2px solid var(--mantine-color-dark-5)" }}>
                    <Flex gap="md" wrap="nowrap">
                        <TextInput
                            flex="1"
                            autoFocus
                            value={text}
                            onChange={(e) => setText(e.currentTarget.value)}
                            onKeyUp={(e) => {
                                if (e.key == "Enter") {
                                    submitChat();
                                    return false;
                                }
                            }}
                        />
                        <Button onClick={submitChat}>Send</Button>
                    </Flex>
                </div>
            </div>
        </Container>
    );
}
