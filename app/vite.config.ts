import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The server's port. scripts/dev.mjs starts the server on SOUNDBOX_PORT and
// Vite inherits the same environment, so moving one moves the proxy with it.
const backend = `http://127.0.0.1:${process.env.SOUNDBOX_PORT || 17494}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: Number(process.env.PORT) || 5174,
    proxy: {
      // Everything under /api, /mcp, /files and /artwork is forwarded so the
      // app has no CORS story in dev.
      "/api": backend,
      "/mcp": backend,
      "/files": backend,
      "/artwork": backend,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
