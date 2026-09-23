import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

/*
 * Runs *.live.test.ts against the real Supabase project and IGDB, with the
 * secrets from .env.local. Server-only modules are allowed here: this is a
 * server context, so the marker package resolves to its no-op build.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.live.test.ts"],
    env: loadEnv("development", process.cwd(), ""),
    testTimeout: 30_000,
  },
});
