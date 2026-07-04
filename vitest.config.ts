import "dotenv/config";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Integration tests must never touch the dev database (research.md §4) —
    // point the app's runtime connection at the dedicated test database for
    // the whole test run instead.
    env: {
      POSTGRES_PRISMA_URL: process.env.TEST_DATABASE_URL,
    },
    // Integration test files share one real Postgres test database with
    // unscoped cleanup (resetDecisions() deletes the whole table). Running
    // test files in parallel lets one file's cleanup delete another file's
    // in-flight fixtures — serialize file execution to avoid that class of
    // flakiness rather than adding per-file data scoping.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
});
