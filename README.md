# Web Game Starter

WebSocket communication, Game Room codes with URL routing, persistent identity & rejoinable sessions.

Uses Bun as the server runtime and package manager, Vite and React for the frontend.

## Development & Building

Create an `.env` file in the root of the project:

```dotenv
# Prefix variables with "VITE_" so Vite can expose them to the client
VITE_SERVER_PORT=3000
VITE_DEV_HOST=localhost
VITE_CLIENT_API_HASH=d7ahc5a34
```

In development mode connect to the client's Vite dev server port (shown in the console, usually `5173`).

In production mode connect to the `SERVER_PORT`.
