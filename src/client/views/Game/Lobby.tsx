import classes from "./Lobby.module.css";

// prettier-ignore
import { Button, Center, Container, Space, Title, Text, Modal, Select } from "@mantine/core";
import { store } from "@/utils/store";
import { TypedClientSocket } from "types/SocketIO";
import { useSnapshot } from "valtio";
import { showErrorNotification } from "@/utils/notifications";
import { ROOM_SIZE_LIMIT } from "types/constants";
import { useState } from "react";
import { DECK_STYLES, DeckStyleName } from "types/Game";
import { useDisclosure } from "@mantine/hooks";
import { IconPlayCardStarFilled } from "@tabler/icons-react";
import { CardsDisplay } from "@/components";

export default function Lobby(props: { socket: TypedClientSocket }) {
    const { socket } = props;
    const context = useSnapshot(store);
    const players = context.gameState.players;

    const isHost = context.gameState.host?.name == context.name || false;

    const [deckStyleName, setDeckStyleName] = useState<DeckStyleName>("Default");
    const [modalOpened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Modal title="Choose Deck Style" opened={modalOpened} onClose={close} centered>
                <Select
                    allowDeselect={false}
                    data={Object.keys(DECK_STYLES)}
                    value={deckStyleName}
                    onChange={(v) => setDeckStyleName(v as DeckStyleName)}
                    searchable={false}
                    mb="xl"
                    style={{ userSelect: "none" }}
                    leftSection={<IconPlayCardStarFilled />}
                />

                <Center>
                    <CardsDisplay
                        cards={[
                            { rank: "J", suit: "CLUBS" },
                            { rank: "Q", suit: "DIAMONDS" },
                            { rank: "K", suit: "HEARTS" },
                            { rank: "A", suit: "SPADES" }
                        ]}
                        deckStyle={DECK_STYLES[deckStyleName]}
                        maxWidth={150}
                    />
                </Center>
            </Modal>

            <Container fluid p="lg">
                <Center>
                    <Title order={3}>
                        Lobby ({players.length}/{ROOM_SIZE_LIMIT})
                    </Title>
                </Center>
                {isHost && (
                    <>
                        <Center>
                            <Text>You are the host.</Text>
                        </Center>

                        <Space h="md" />

                        <Center>
                            <Button onClick={open} leftSection={<IconPlayCardStarFilled />}>
                                Choose Deck Style
                            </Button>
                        </Center>
                    </>
                )}

                <Space h="xl" />

                <Center>
                    <Text c="dimmed" style={{ userSelect: "none" }}>
                        Players:
                    </Text>
                </Center>

                <div>
                    {players.map((p) => (
                        <div key={p.name}>
                            <Center>
                                {p.connected ? (
                                    <Text fz="lg">{p.name}</Text>
                                ) : (
                                    <Text fz="lg" className={classes.playerDisconnected}>
                                        {p.name}
                                    </Text>
                                )}
                            </Center>
                        </div>
                    ))}
                </div>
            </Container>

            {isHost && (
                <div className={classes.footer}>
                    <Container size={300}>
                        {players.length < 2 && (
                            <Center>
                                <Text c="dimmed" fz="sm" style={{ userSelect: "none" }}>
                                    Need 1 more player to start.
                                </Text>
                            </Center>
                        )}

                        <div>
                            <Button
                                fullWidth
                                size="md"
                                disabled={players.length < 2}
                                onClick={() => {
                                    socket.emit(
                                        "startGame",
                                        { deckStyle: deckStyleName },
                                        ({ success, error }) => {
                                            if (!success) showErrorNotification({ message: error });
                                        }
                                    );
                                }}
                            >
                                Start Game
                            </Button>
                        </div>
                    </Container>
                </div>
            )}
        </>

        // <div>
        //     <h1>Lobby</h1>

        //     <PlayerList />

        //     {context.gameState.host?.name == context.name && (
        //         <div>
        //             <h2>You are the host</h2>
        //             <button
        //                 disabled={players.length < 2}
        //                 onClick={() => {
        //                     socket.emit("startGame", () => {});
        //                 }}
        //             >
        //                 Start Game
        //             </button>
        //         </div>
        //     )}

        //     <Chat socket={socket} />
        // </div>
    );
}
