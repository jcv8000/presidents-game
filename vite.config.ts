import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";
import paths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(() => {
    process.env.VITE_APP_VERSION = pkg.version;
    return {
        plugins: [paths(), react(), VitePWA({ manifest: { theme_color: "#6741d9" } })],
        build: {
            outDir: "dist/client"
        },
        server: {
            host: "localhost"
        }
    };
});
