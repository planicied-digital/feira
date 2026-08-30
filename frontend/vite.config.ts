import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const APP_BASE = "/sistemas/feira/";
const API_PREFIX = "/sistemas/feira/api";

// Vite só permite localhost/127.0.0.1 por padrão (proteção contra DNS rebinding) — qualquer outro
// Host repassado por um proxy reverso (ex.: domínio da VPS) precisa ser liberado explicitamente.
// Lido de env em vez de fixo no código porque esse domínio muda (sslip.io agora, domínio de
// verdade depois) sem precisar tocar neste arquivo de novo.
const allowedHosts = process.env.VITE_ALLOWED_HOSTS?.split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  base: APP_BASE,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts,
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
