import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    // Live tests call real services and need secrets; they run only via `npm run test:live`.
    exclude: [...configDefaults.exclude, "**/*.live.test.ts"],
  },
});
