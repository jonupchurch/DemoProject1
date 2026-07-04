import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 config: the CLI (migrate, db seed, studio) reads its connection
// from here. This MUST be the direct/non-pooled URL — migrations require a
// direct connection (research.md §2). The pooled URL used by the running
// application at runtime is configured separately via the driver adapter in
// src/lib/db.ts, not here.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("POSTGRES_URL_NON_POOLING"),
  },
});
