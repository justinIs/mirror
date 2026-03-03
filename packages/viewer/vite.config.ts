import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/token": {
        target: "http://localhost:7890",
        changeOrigin: true,
      },
      "/livekit": {
        target: "ws://localhost:7880",
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/livekit/, ""),
      },
    },
  },
  appType: "spa",
});
