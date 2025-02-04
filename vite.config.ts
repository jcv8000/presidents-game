import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";
import paths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(() => {
    process.env.VITE_APP_VERSION = pkg.version;

    let devOptions: Partial<UserConfig> = {};
    if (process.env.NODE_ENV === "development")
        devOptions = {
            resolve: {
                alias: {
                    "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs"
                }
            }
        };

    return {
        plugins: [
            paths(),
            react(),
            VitePWA({
                includeAssets: ["favicon.ico", "apple-touch-icon.png"],
                manifest: {
                    name: "Presidents - Online Card Game",
                    short_name: "Presidents",
                    theme_color: "#6741d9",
                    background_color: "#242424",
                    icons: [
                        {
                            src: "favicon-192x192.png",
                            sizes: "192x192",
                            type: "image/png"
                        },
                        {
                            src: "favicon-512x512.png",
                            sizes: "512x512",
                            type: "image/png"
                        }
                    ]
                },
                injectRegister: false
            })
        ],
        build: {
            outDir: "dist/client"
        },
        server: {
            host: import.meta.env.VITE_DEV_HOST || "localhost",
            port: 5173,
            strictPort: true
        },
        ...devOptions
    };
});
