import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Runtime connection uses the pooled URL (PgBouncer-backed on Vercel Postgres);
// `prisma.config.ts` separately configures the direct URL for migrations only
// (research.md §2).
const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL!,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
