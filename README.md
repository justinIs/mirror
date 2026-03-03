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
- [LiveKit server](https://docs.livekit.io/home/self-hosting/local/) running locally

## Setup

```sh
nvm use
corepack enable
pnpm install
pnpm build
```

## Run

**1. Start LiveKit**

```sh
livekit-server --dev
```

This runs on `ws://localhost:7881` with API key `devkey` and secret `secret`.

**2. Start the token server**

```sh
pnpm dev:server
```

Listens on `http://localhost:7880`.

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
PORT=7880
```

Copy `.env.example` to `.env` to override.
