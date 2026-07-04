import { rm } from "node:fs/promises";
import { vi, type Mock } from "vitest";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LOCAL_PHOTO_STORAGE_DIR } from "@/lib/photo-storage/local";

// `auth` is overloaded (bare session-fetch vs. middleware-wrapping); the
// mock only ever needs to behave as the former here.
const mockedAuth = auth as unknown as Mock<() => Promise<{ user: { id: string }; expires: string } | null>>;

/** Creates (or reuses) a test User row to own fixture decisions. */
export async function ensureTestUser(email = "test-user@example.com") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({ data: { email, emailVerified: new Date() } });
}

/**
 * Makes `auth()` (mocked globally in vitest.setup.ts) resolve as if this
 * user id were signed in — `getCurrentUserId()`/`requireCurrentUserId()`
 * read this the same way they'd read a real Auth.js session.
 */
export function mockSessionAs(userId: string | null) {
  mockedAuth.mockResolvedValue(
    userId
      ? { user: { id: userId }, expires: new Date(Date.now() + 86_400_000).toISOString() }
      : null,
  );
}

/** Clears decisions (and cascaded options/resolutions) between tests. */
export async function resetDecisions() {
  await prisma.decision.deleteMany();
}

/**
 * Clears pins (and cascaded photos) between tests, and the local-filesystem
 * PhotoStorage driver's on-disk files those photos pointed at — otherwise
 * repeated test runs would keep accumulating orphaned files under
 * `.data/photo-storage/` (gitignored, but not otherwise cleaned up).
 */
export async function resetPins() {
  await prisma.pin.deleteMany();
  await rm(LOCAL_PHOTO_STORAGE_DIR, { recursive: true, force: true });
}
