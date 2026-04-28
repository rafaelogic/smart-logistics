import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "client",
  publicDir: "public",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src")
    }
  },
  build: {
    outDir: "../public",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:3000",
      "/warehouses": "http://localhost:3000",
      "/items": "http://localhost:3000",
      "/inventory": "http://localhost:3000",
      "/docs": "http://localhost:3000",
      "/openapi.json": "http://localhost:3000"
    }
  },
  test: {
    root: ".",
    include: ["tests/**/*.test.ts"],
    environment: "node"
  }
});
