# Web Game Starter

WebSocket communication, Game Room codes with URL routing, persistent identity & rejoinable sessions.

Uses Bun 1.2 as the server runtime and package manager, Vite and React for the frontend.

## Development & Building

Create an `.env.local` file in the root of the project:

```dotenv
VITE_SERVER_PORT=3000
VITE_APP_VERSION=0.0.0
```

In development mode connect to the client's Vite dev server port (shown in the console, usually `5173`).

In production mode connect to the `SERVER_PORT`.
