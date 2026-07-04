import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Server Actions call revalidatePath/revalidateTag, which require Next's
// request-scoped static generation store — absent when tests call actions
// directly outside of Next's server runtime. Tests verify data persistence
// and validation, not cache invalidation, so this framework side-effect is
// mocked out globally rather than worked around per test file.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// redirect() has the same request-context requirement — it throws a
// Next-internal signal caught by the framework's own render pipeline, which
// doesn't exist here. Only `redirect` is stubbed; everything else (useRouter,
// notFound, etc.) is preserved in case component-level tests need it later.
vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    redirect: vi.fn(),
  };
});

// auth() reads request-scoped cookies via Next's async context, which
// doesn't exist outside a real request either. Tests control the "signed-in
// as" user directly via tests/integration/setup.ts's mockSessionAs() rather
// than exercising real Auth.js session verification (research.md §6 — OAuth
// itself is never simulated in this suite).
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));
