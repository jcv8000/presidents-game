// prettier-ignore
import { Button, Center, Container, Divider, Fieldset, Stack, Text, TextInput } from "@mantine/core";

import { getCookie, setCookie } from "@/utils/cookies";
import { showErrorNotification } from "@/utils/notifications";
import { socket } from "@/utils/socket";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ROOM_CODE_SIZE } from "types/constants";

export default function Home() {
    const [code, setCode] = useState(getCookie("code")?.toUpperCase() || "");
    const [codeError, setCodeError] = useState("");
    const [name, setName] = useState(getCookie("name") || "");
    const [nameError, setNameError] = useState("");
    const [formDisabled, setFormDisabled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        socket.connect();

        return () => {
            socket.disconnect();
        };
    }, []);

    function createNewGame(name: string) {
        if (socket.connected) {
            setCookie("name", name);
            notifications.clean();
            setFormDisabled(true);

            socket.emit("createNewGame", ({ success, code, error }) => {
                if (success && code) {
                    socket.disconnect();
                    navigate(`game/${code}`);
                } else {
                    showErrorNotification({ message: error });
                    setFormDisabled(false);
                }
            });
        } else showErrorNotification({ message: "Socket not connected" });
    }

    function joinGame(name: string, code: string) {
        setCookie("name", name);
        setCookie("code", code.toLowerCase());

        setFormDisabled(true);
        navigate(`/game/${code.toLowerCase()}`);
    }

    return (
        <Container fluid h="100vh">
            <Center h="100%">
                <Stack>
                    <TextInput
                        autoFocus
                        w="100%"
                        label="Name"
                        error={nameError}
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        disabled={formDisabled}
                    />

                    <Divider size="md" />

                    <Fieldset variant="filled" disabled={formDisabled}>
                        <TextInput
                            mb="md"
                            label="Room Code"
                            maxLength={ROOM_CODE_SIZE}
                            error={codeError}
                            value={code}
                            onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
                        />
                        <Button
                            fullWidth
                            onClick={() => {
                                code == "" ? setCodeError("Enter a room code.") : setCodeError("");
                                name == "" ? setNameError("Enter a name.") : setNameError("");

                                if (code != "" && name != "") {
                                    joinGame(name, code);
                                }
                            }}
                        >
                            Join Game
                        </Button>
                    </Fieldset>

                    <Divider variant="dashed" size="md" label="OR" labelPosition="center" />

                    <Fieldset py="md" variant="filled" disabled={formDisabled}>
                        <Center>
                            <Button
                                fullWidth
                                onClick={() => {
                                    if (name != "") {
                                        setNameError("");
                                        createNewGame(name);
                                    } else setNameError("Enter a name.");
                                }}
                            >
                                Create New Game
                            </Button>
                        </Center>
                    </Fieldset>
                    <Text size="xs" c="dimmed" ta="center">
                        Version {import.meta.env.VITE_APP_VERSION}
                    </Text>
                </Stack>
            </Center>
        </Container>
    );
}
