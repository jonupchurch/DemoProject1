import { prisma } from "@/lib/db";

/**
 * The Owner row persists for an entire test file's run (never deleted
 * between tests) so `getCurrentOwnerId()`'s in-memory cache (src/lib/owner.ts)
 * never points at a row that's been removed mid-run.
 */
export async function ensureOwner() {
  const existing = await prisma.owner.findFirst();
  if (existing) return existing;
  return prisma.owner.create({ data: {} });
}

/** Clears decisions (and cascaded options/resolutions) between tests. */
export async function resetDecisions() {
  await prisma.decision.deleteMany();
}
