# Mirror

Screen sharing via WebRTC through a LiveKit SFU. A Chrome extension captures your screen and publishes it to a LiveKit room; a viewer web page subscribes and displays the stream.

## Structure

```
packages/
  shared/         Abstractions (SFUProvider, HttpTokenProvider) used by extension + viewer
  token-server/   Hono server that issues LiveKit JWT tokens
  extension/      Chrome MV3 extension (popup → service worker → offscreen document)
  viewer/         Vite SPA that subscribes to a room and renders video
```

## Prerequisites

- Node 24.14.0 (`nvm use`)
- pnpm (`corepack enable`)
- LiveKit server running locally (see below)

## Installing LiveKit

### Standalone binary (recommended for local dev)

```sh
curl -sSL https://get.livekit.io | bash
```

This installs the `livekit-server` binary. Start it in dev mode:

```sh
livekit-server --dev
```

Runs on `ws://localhost:7880` with API key `devkey` and secret `secret`. No config needed.

### Podman

```sh
podman run --rm -p 7880:7880 -p 7882:7882 livekit/livekit-server --dev --bind 0.0.0.0
```

`--bind 0.0.0.0` is required because `--dev` defaults to localhost, which is unreachable from outside the container. Port 7882 is the TCP/TURN port for WebRTC connectivity.

## Setup

```sh
nvm use
corepack enable
pnpm install
pnpm build
```

## Run

**1. Start LiveKit** (see [Installing LiveKit](#installing-livekit) above)

```sh
livekit-server --dev
```

**2. Start the token server**

```sh
pnpm dev:server
```

Listens on `http://localhost:7890`.

**3. Start the viewer**

```sh
pnpm dev:viewer
```

Opens at `http://localhost:5173`.

**4. Load the extension**

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `packages/extension/dist/`
4. Click the Mirror extension icon → enter a room name and your name → Start Sharing
5. In the viewer, enter the same room name → Connect

## Environment variables

The token server reads from the environment (defaults shown):

```
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
PORT=7890
```

Copy `.env.example` to `.env` to override.
