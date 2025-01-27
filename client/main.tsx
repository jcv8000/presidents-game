import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import Game from "@/views/Game";
import Home from "@/views/Home";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <MantineProvider
            theme={{ fontFamily: "Itim", primaryColor: "violet" }}
            defaultColorScheme="dark"
        >
            <Notifications />

            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="game/:code" element={<Game />} />
                </Routes>
            </BrowserRouter>
        </MantineProvider>
    </StrictMode>
);
