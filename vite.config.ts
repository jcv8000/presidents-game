import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";
import paths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(() => {
    process.env.VITE_APP_VERSION = pkg.version;
    return {
        plugins: [react(), paths()],
        build: {
            outDir: ".vite"
        },
        server: {
            host: "localhost"
        }
    };
});
