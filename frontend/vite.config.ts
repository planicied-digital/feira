import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const APP_BASE = "/sistemas/feira/";
const API_PREFIX = "/sistemas/feira/api";

export default defineConfig({
  base: APP_BASE,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Bind mount do docker-compose não propaga eventos inotify no Windows/Docker Desktop —
    // sem polling, o Vite não percebe mudanças de arquivo feitas no host.
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      [API_PREFIX]: {
        target: process.env.BACKEND_INTERNAL_URL ?? "http://localhost:3333",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(new RegExp(`^${API_PREFIX}`), ""),
      },
    },
  },
});
