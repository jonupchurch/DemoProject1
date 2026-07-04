import { afterEach, describe, expect, it, vi } from "vitest";
import { getVerifiedGithubEmail } from "@/lib/github-email";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockEmailsResponse(emails: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emails),
    }),
  );
}

describe("getVerifiedGithubEmail", () => {
  it("returns the primary email when it is verified", async () => {
    mockEmailsResponse([
      { email: "secondary@example.com", primary: false, verified: true },
      { email: "primary@example.com", primary: true, verified: true },
    ]);

    const email = await getVerifiedGithubEmail("token");
    expect(email).toBe("primary@example.com");
  });

  it("returns null when the primary email is not verified (FR-004)", async () => {
    mockEmailsResponse([{ email: "primary@example.com", primary: true, verified: false }]);

    const email = await getVerifiedGithubEmail("token");
    expect(email).toBeNull();
  });

  it("returns null when there are no emails at all", async () => {
    mockEmailsResponse([]);

    const email = await getVerifiedGithubEmail("token");
    expect(email).toBeNull();
  });

  it("returns null (not a throw) when the GitHub API call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve([]) }));

    const email = await getVerifiedGithubEmail("token");
    expect(email).toBeNull();
  });
});
