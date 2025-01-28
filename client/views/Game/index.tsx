// prettier-ignore
import { Center, Container, Loader, Overlay } from "@mantine/core";

import { getCookie, setCookie } from "@/utils/cookies";
import { showErrorNotification, showGameNotification } from "@/utils/notifications";
import { socket } from "@/utils/socket";
import { store } from "@/utils/store";
import { notifications } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ARTIFICIAL_CONNECT_DELAY, UUID_LENGTH } from "types/constants";
import { v4 as uuid } from "uuid";
import { useSnapshot } from "valtio";
import Lobby from "./Lobby";
import Presidents from "./Presidents";

export default function Game() {
    const { code } = useParams();
    const navigate = useNavigate();
    const context = useSnapshot(store);

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

        socket.on("playerSkipped", (name) => {
            showGameNotification({ title: "Skipped", message: `${name} was skipped` });
        });

        socket.connect();

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("gameStateUpdate");
            socket.off("playerSkipped");
            socket.disconnect();
        };
    }, [code, navigate]);

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
        <Container fluid h="100vh" p={"lg"}>
            {!connected && (
                <Overlay backgroundOpacity={0.7}>
                    <Center h="100%">
                        <Loader type="oval" />
                    </Center>
                </Overlay>
            )}
            <div>Game Code: {context.code.toUpperCase()}</div>
            <div>
                <button onClick={() => navigate("/")}>Leave Game</button>
            </div>

            {context.gameState.stage == "lobby" && <Lobby socket={socket} />}
            {context.gameState.stage == "in-game" && <Presidents socket={socket} />}
        </Container>
    );
}
