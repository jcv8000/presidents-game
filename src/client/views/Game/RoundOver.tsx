import classes from "./RoundOver.module.css";

import { store } from "@/utils/store";
import { Container, Progress, Stack, Title } from "@mantine/core";
import { TIMER_DELAY_SECONDS } from "types/constants";
import { useSnapshot } from "valtio";

export default function RoundOver() {
    const state = useSnapshot(store).gameState;

    const normalGameResults = (
        <>
            <Title>President: {state.president?.name}</Title>
            <Title>VP: {state.vicePresident?.name}</Title>
            <Title>2nd to Last: {state.secondToLast?.name}</Title>
            <Title>LOSER: {state.loser?.name}</Title>
        </>
    );

    const smallGameResults = (
        <>
            <Title>President: {state.president?.name}</Title>
            <Title>Loser: {state.loser?.name}</Title>
        </>
    );

    return (
        <Container fluid p="lg">
            <Stack align="center">
                <div>{state.players.length > 4 ? normalGameResults : smallGameResults}</div>
            </Stack>

            <div className={classes.footer}>
                <Progress
                    size="xl"
                    radius={0}
                    value={(state.timer / TIMER_DELAY_SECONDS) * 100}
                    animated
                />
            </div>
        </Container>
    );
}
