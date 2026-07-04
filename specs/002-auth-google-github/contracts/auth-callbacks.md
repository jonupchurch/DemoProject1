# Phase 1 Contracts: Auth Callback Helpers

No public API in this phase either (same reasoning as phase 1 — this is an internal contract for
the pure functions Auth.js callbacks call into, so `/speckit-tasks` and implementation agree on
shape without re-deriving it).

## `src/lib/github-email.ts`

### `getVerifiedGithubEmail(accessToken: string): Promise<string | null>`

- Calls `GET https://api.github.com/user/emails` with the given OAuth access token.
- Returns the email where `primary: true AND verified: true`, or `null` if no such email exists.
- Never throws for "no verified email" — that's a valid, expected `null` result (research.md §4),
  not an error condition.

## `src/lib/auth-linking.ts`

### `verifiedEmailOrNull(email: string | null | undefined, verified: boolean | undefined): string | null`

- Returns `email` when both `email` is present and `verified` is `true`; returns `null` otherwise.
- This is the entire custom logic FR-003/FR-004 depend on (research.md §5, revised). It's used
  directly in the Google provider's `profile()` callback in `src/auth.config.ts`:
  `email: verifiedEmailOrNull(profile.email, profile.email_verified)`. GitHub doesn't need this
  helper — `getVerifiedGithubEmail()` already only returns a verified email or `null`.
- The actual linking mechanism (matching this email against an existing `User`, creating a new
  `Account` row) is Auth.js's own built-in behavior, enabled via
  `allowDangerousEmailAccountLinking: true` on both providers — safe here specifically *because*
  the email these providers report has already been filtered to verified-only before Auth.js ever
  sees it. Nothing in this project re-implements that matching/linking logic.

## `src/lib/session.ts`

### `getCurrentUserId(): Promise<string | null>`

- Reads the current Auth.js session server-side (via `auth()` from `src/auth.ts`).
- Returns the signed-in user's id, or `null` if there is no session.
- Replaces phase 1's `getCurrentOwnerId()` (which always returned the single hardcoded owner and
  threw if unseeded); every existing caller in `src/lib/decisions.ts` swaps to this function and
  MUST handle the `null` case by treating the caller as unauthenticated (research.md §3 —
  server-side check, not just relying on `proxy.ts`).

### `requireCurrentUserId(): Promise<string>`

- Calls `getCurrentUserId()`; if `null`, redirects to the sign-in prompt (`redirect("/")`) instead of
  returning.
- Used by every protected layout/page as the actual enforcement point (research.md §3) — this is
  what `src/app/decisions/layout.tsx` and each decision page call before touching any data.
