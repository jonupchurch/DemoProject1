// Edge-safe (pure function, no I/O) — same reasoning as github-email.ts.

/**
 * The one piece of custom logic FR-003/FR-004 depend on (research.md §5,
 * revised): only ever hand Auth.js a real email when it's verified. Used in
 * the Google provider's profile() step; GitHub's own getVerifiedGithubEmail
 * already returns verified-or-null, so it doesn't need this helper.
 */
export function verifiedEmailOrNull(
  email: string | null | undefined,
  verified: boolean | undefined,
): string | null {
  return email && verified ? email : null;
}
