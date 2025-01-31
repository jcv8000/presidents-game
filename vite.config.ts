import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";
import paths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(() => {
    const host = "192.168.1.125";
    process.env.VITE_APP_VERSION = pkg.version;
    process.env.VITE_DEV_CLIENT_URL = `${host}:${process.env.VITE_SERVER_PORT}`;

    return {
        plugins: [paths(), react(), VitePWA({ manifest: { theme_color: "#6741d9" } })],
        build: {
            outDir: "dist/client"
        },
        server: {
            host: "192.168.1.125"
        }
    };
});
