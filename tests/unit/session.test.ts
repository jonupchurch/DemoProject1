import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUserId, requireCurrentUserId } from "@/lib/session";

// `auth` is overloaded (bare session-fetch vs. middleware-wrapping); the
// mock only ever needs to behave as the former here (see tests/integration/setup.ts).
const mockedAuth = auth as unknown as Mock<() => Promise<{ user: { id: string }; expires: string } | null>>;

afterEach(() => {
  mockedAuth.mockReset();
  vi.mocked(redirect).mockReset();
});

describe("getCurrentUserId", () => {
  it("returns null when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);
    expect(await getCurrentUserId()).toBeNull();
  });

  it("returns the user id when a session exists", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-1" },
      expires: new Date().toISOString(),
    } as never);
    expect(await getCurrentUserId()).toBe("user-1");
  });
});

describe("requireCurrentUserId", () => {
  it("redirects to the sign-in prompt when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);
    await requireCurrentUserId();
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("returns the user id without redirecting when a session exists", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-1" },
      expires: new Date().toISOString(),
    } as never);
    const userId = await requireCurrentUserId();
    expect(userId).toBe("user-1");
    expect(redirect).not.toHaveBeenCalled();
  });
});
