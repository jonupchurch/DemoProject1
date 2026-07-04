// Edge-safe (only uses the web-standard `fetch`) — this is called from
// src/auth.config.ts's GitHub provider profile() step, which must remain
// importable from src/proxy.ts (edge runtime). No server-only guard here.

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/**
 * GitHub's default OAuth profile doesn't reliably expose email verification
 * (research.md §4) — this queries the emails endpoint directly and returns
 * only the primary, verified email, or null if there isn't one. Never
 * throws: a missing/unverified email is an expected, valid outcome, and any
 * GitHub API failure is treated the same way rather than breaking sign-in.
 */
export async function getVerifiedGithubEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const emails: GithubEmail[] = await response.json();
    const primaryVerified = emails.find((email) => email.primary && email.verified);
    return primaryVerified?.email ?? null;
  } catch {
    return null;
  }
}
