import { afterEach, describe, expect, it } from "vitest";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

// Proves our schema/adapter setup actually supports the linking Auth.js
// performs at the real, email-gated sign-in (src/auth.config.ts, T014) — the
// email-gating decision itself is unit-tested in US1 (verifiedEmailOrNull,
// getVerifiedGithubEmail). This does not simulate an OAuth handshake
// (research.md §6); it exercises the adapter directly.
const adapter = PrismaAdapter(prisma);

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "adapter-test" } } });
});

describe("PrismaAdapter linking (spec.md US3)", () => {
  it("finds the same User across two linked provider Accounts sharing one email", async () => {
    const email = "adapter-test-link@example.com";

    const user = await adapter.createUser!({
      email,
      emailVerified: new Date(),
    } as never);

    await adapter.linkAccount!({
      userId: user.id,
      type: "oauth",
      provider: "google",
      providerAccountId: "google-123",
    } as never);

    // Simulates the second sign-in (GitHub, same verified email) finding
    // the existing User before linking a second Account to it.
    const existing = await adapter.getUserByEmail!(email);
    expect(existing?.id).toBe(user.id);

    await adapter.linkAccount!({
      userId: existing!.id,
      type: "oauth",
      provider: "github",
      providerAccountId: "github-456",
    } as never);

    const viaGoogle = await adapter.getUserByAccount!({
      provider: "google",
      providerAccountId: "google-123",
    });
    const viaGithub = await adapter.getUserByAccount!({
      provider: "github",
      providerAccountId: "github-456",
    });

    expect(viaGoogle?.id).toBe(user.id);
    expect(viaGithub?.id).toBe(user.id);
  });

  it("finds no user for an email that was never created (mismatched-email case)", async () => {
    const existing = await adapter.getUserByEmail!("adapter-test-no-match@example.com");
    expect(existing).toBeNull();
  });
});
