// Applies the same migration history to the dedicated test database
// (research.md §4) that `prisma migrate dev` already applied to dev.
// Re-run this whenever a new migration is added.
import "dotenv/config";
import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  POSTGRES_URL_NON_POOLING: process.env.TEST_DATABASE_URL,
};

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
