# Implementation Plan: Authentication via Google & GitHub SSO

**Branch**: `002-auth-google-github` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-auth-google-github/spec.md`

## Summary

Replace phase 1's single hardcoded placeholder `Owner` with real accounts authenticated via Google
or GitHub OAuth, using Auth.js v5 (the `next-auth@beta` package — v5 has not graduated to the
`latest` npm tag as of this writing) with the Prisma adapter. Every decision-related route is
protected both by an edge `proxy.ts` (Next.js 16's renamed `middleware.ts`) *and* a server-side
session check in each protected layout/page, since edge-proxy-only protection is a known-bypassable
pattern (CVE-2025-29927). Account linking across providers happens only when the incoming profile's
email is verified — Google's standard profile is trustworthy as-is, but GitHub's is not (its default
`/user` profile does not reliably expose verification status), so the GitHub provider needs a custom
profile step that queries `/user/emails` for the actual verified primary email.

## Technical Context

**Language/Version**: TypeScript 5.x strict, Next.js 16 (App Router) / React 19 — unchanged from
phase 1

**Primary Dependencies**: `next-auth@beta` (Auth.js v5), `@auth/prisma-adapter`, existing Prisma/
`@prisma/adapter-pg` stack

**Storage**: Same Postgres database (Vercel Postgres in prod, local Postgres in dev/test per phase
1). Schema extended with Auth.js's standard adapter models.

**Testing**: Vitest, extending phase 1's suite. Account-linking and GitHub-email-verification logic
is written as plain, testable functions called from Auth.js callbacks (not left inline), so they get
real unit test coverage without needing to simulate an OAuth handshake. Route-protection is
integration-tested by calling the same server-side session-check helper the pages use. Actually
completing a live Google/GitHub consent screen is not automated — `quickstart.md` calls this out as
a manual verification step, consistent with how OAuth testing is done in practice.

**Target Platform**: Vercel serverless (Node runtime) for the auth route handler and Prisma-backed
config; Vercel Edge runtime for `proxy.ts`, which MUST stay adapter-free (no Prisma) to run there.

**Project Type**: Web application — same single Next.js project, no new services.

**Performance Goals**: Same Lighthouse 95+ Performance/Accessibility targets as phase 1 (constitution
Principle VII). Phase 1's Performance exception (documented in `specs/001-decision-log-revisit/plan.md`)
carries forward as a known, already-justified gap — not re-litigated here unless the new sign-in
page changes the picture materially.

**Constraints**:
- **Split config is structurally required, not a design choice**: `auth.config.ts` (providers,
  pages, callbacks — edge-safe, no adapter) is imported by both `auth.ts` (adds the Prisma adapter,
  Node runtime only) and `proxy.ts` (edge runtime). Importing `auth.ts` from `proxy.ts` would pull
  Prisma/`pg` into the edge bundle and fail, the same class of bug phase 1 hit with Client
  Components.
- **Session strategy MUST be JWT**, not database sessions — the edge `proxy.ts` needs to verify a
  session without a database round trip (edge runtime can't reach Prisma), and Auth.js requires JWT
  strategy for that. The Prisma adapter is still used for persisting `User`/`Account`/
  `VerificationToken` data (account linking, provider identities) — only the *session* itself skips
  the database.
- **Proxy-only protection is insufficient (CVE-2025-29927)**: a spoofed `x-middleware-subrequest`
  header can bypass Next.js middleware/proxy-based auth checks. `proxy.ts` gives a fast redirect for
  the common case, but every protected Server Component/layout MUST also independently verify the
  session server-side before touching decision data — this is the actual enforcement point for
  constitution Principle III, not the proxy.
- **GitHub's default profile does not reliably report email verification** — some accounts return a
  null email (private-by-default) or an `email_verified`-equivalent that doesn't reflect GitHub's
  real state. The GitHub provider needs the `user:email` scope and a custom profile step that calls
  `GET https://api.github.com/user/emails` and selects the entry where `primary: true` and
  `verified: true`. Google's standard OIDC profile's `email_verified` field is trustworthy as-is.

**Scale/Scope**: Still a single-developer personal tool; "multi-account" capability is being built
as a real, correct feature (constitution Technology Constraints) even though in practice only the
project owner's own Google and GitHub accounts will use it.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Type Safety & Simplicity** — PASS. The auth.config/auth split exists because the framework
  structurally requires it (edge vs. Node runtime), not by choice — same category of justified
  necessity as phase 1's pooled/direct DB connection split. Account-linking and GitHub-email logic
  are pure functions, not inline callback spaghetti.
- **II. Extensive Test Coverage (NON-NEGOTIABLE)** — PASS (enforced in tasks). Linking-decision logic
  and GitHub verified-email extraction get unit tests covering verified/unverified/mismatched-email
  cases; route protection gets integration tests against the shared session-check helper.
- **III. Privacy & Data Ownership (NON-NEGOTIABLE)** — this phase *is* the delivery of this
  principle. PASS, with the explicit requirement that protection lives in Server
  Components/layouts (defense in depth), not solely in `proxy.ts`, given CVE-2025-29927.
- **IV. WCAG 2.1 AA Accessibility (NON-NEGOTIABLE)** — PASS (verified with axe during
  implementation, as in phase 1). Sign-in page uses labeled, keyboard-operable controls and the
  established design tokens.
- **V. Transparent AI Assistance** — N/A, no AI content in this phase.
- **VI. Clean, Elegant Design** — PASS. Sign-in page reuses phase 1's design tokens; no new palette.
- **VII. Performance & Quality Bar (Lighthouse)** — **Measured**: sign-in page (`/`) scores
  Accessibility 100, Best Practices 100, SEO 100, Performance 82 (production build). Performance
  sits squarely within phase 1's already-documented 78-91 range, confirming this is the same
  Next.js/Turbopack framework-level characteristic (specs/001-decision-log-revisit/plan.md), not a
  regression introduced by this feature. Axe reports zero accessibility violations on the sign-in
  page.

No unresolved violations against NON-NEGOTIABLE principles. Complexity Tracking table is
intentionally empty — the split-config requirement is a framework constraint, not an added
abstraction we chose (see Constraints above).

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-google-github/
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── auth-callbacks.md      # Phase 1 output — linking/verification function signatures
└── tasks.md                   # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma                # extended with User, Account (Auth.js's own, i.e. "linked
                                  # sign-in" per spec.md — NOT the same thing as spec.md's
                                  # "Account" entity, which maps to Auth.js's User model),
                                  # Session, VerificationToken; Decision.ownerId now references
                                  # User instead of the removed Owner model

src/
├── auth.config.ts                # Edge-safe: providers (Google, GitHub with custom profile/
│                                 # emails lookup), pages, authorized() callback. No adapter here.
├── auth.ts                       # Adds PrismaAdapter + jwt session strategy; exports
│                                 # auth/signIn/signOut/handlers. Node runtime only.
├── proxy.ts                      # Next.js 16's middleware.ts equivalent — edge check; fast-path
│                                 # redirect only, not the sole enforcement point.
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts             # Auth.js route handler (GET/POST)
│   ├── page.tsx                 # updated: signed-out -> sign-in prompt; signed-in -> redirect
│   │                             # to /decisions
│   └── decisions/
│       ├── layout.tsx            # NEW: server-side session check (defense in depth per
│       │                         # CVE-2025-29927) wrapping all decision routes; redirects to
│       │                         # sign-in if unauthenticated
│       ├── page.tsx              # updated: listDecisions scoped to the real session user
│       ├── new/page.tsx          # unchanged structurally
│       └── [id]/
│           ├── page.tsx          # updated: ownership check (403/redirect on cross-account access)
│           └── edit/page.tsx     # updated: same ownership check
├── lib/
│   ├── owner.ts                 # replaced by src/lib/session.ts (getCurrentUserId() from the
│   │                             # real Auth.js session, not a hardcoded row)
│   ├── auth-linking.ts           # NEW: verifiedEmailOrNull() — the one bit of custom logic
│   │                             # FR-003/FR-004 need; actual linking is Auth.js's own adapter
│   │                             # behavior (allowDangerousEmailAccountLinking), safe here because
│   │                             # only verified emails ever reach it (research.md §5, revised)
│   └── github-email.ts           # NEW: pure function wrapping the GitHub /user/emails call,
│                                 # returning the verified primary email or null
└── components/
    └── auth/
        └── sign-in-buttons.tsx    # "Continue with Google" / "Continue with GitHub" (Client
                                  # Component — calls Auth.js's signIn() directly)

tests/
├── unit/
│   ├── github-email.test.ts     # verified/unverified/missing GitHub email extraction
│   └── auth-linking.test.ts     # verifiedEmailOrNull gating logic
└── integration/
    ├── auth-access.test.ts      # session-check helper denies cross-account access; redirects
    │                             # unauthenticated requests
    └── auth-adapter.test.ts     # PrismaAdapter + our schema actually support linking a second
                                  # provider Account to an existing User by email (US3)
```

**Structure Decision**: Same single Next.js App Router project. The auth.config/auth/proxy split is
mandatory per the Constraints above, not a structural choice being made freely. `src/lib/owner.ts`
is retired (phase 1's research.md §5 explicitly anticipated this swap); its callers already only
depend on "get the current owner's id," so replacing it with `src/lib/session.ts#getCurrentUserId()`
requires no changes to `src/lib/decisions.ts` beyond the import.

## Complexity Tracking

*No constitution violations require justification. Table intentionally left empty — see Constraints
above for why the split-config pattern is a framework requirement, not an optional abstraction.*

## Post-Implementation Amendments

**2026-07-04 — Global navigation, home page showcase content, About page.** After this phase
shipped and was verified end-to-end, the project owner asked for a UI pass on top of it, implemented
directly rather than through a new spec-kit cycle (presentational change, no new data/security
requirements):

- **`src/components/nav/nav-bar.tsx`** (new, Server Component) — a shared nav bar rendered from the
  root layout (`src/app/layout.tsx`), appearing on every page. Shows brand + `nav-links.tsx` (Home /
  About / Decisions, active-state highlighted via `usePathname`) + either a "Sign in" link or
  **`src/components/auth/user-menu.tsx`** (new, Client Component): an avatar button (the signed-in
  user's `image`, falling back to their name's first initial) that opens a small popover containing
  `sign-out-button.tsx`, closing on outside-click or Escape.
- **`src/app/decisions/layout.tsx` simplified** — its own header (built in this phase's US4) is
  removed; the auth guard (`requireCurrentUserId()`) is unchanged and still the actual enforcement
  point. Sign-out now lives in the global nav's `UserMenu` instead.
- **`src/app/page.tsx` behavior change** — no longer redirects signed-in visitors to `/decisions`
  (this phase's original US1 behavior). The home page is now a public showcase page for anyone,
  signed in or not, with project description/features and a GitHub link; the CTA adapts (sign-in
  buttons vs. a "go to your decisions" link) based on session state. See spec.md's Assumptions for
  the corresponding update — FR-001 through FR-009 are otherwise unaffected (sign-in, linking, data
  isolation, and sign-out itself all work exactly as originally spec'd).
- **`src/app/about/page.tsx`** (new) — a public bio/portfolio page, placeholder content pending the
  project owner's real copy.
- **`next.config.js`** — added `images.remotePatterns` for `lh3.googleusercontent.com` (Google
  avatars) and `avatars.githubusercontent.com` (GitHub avatars) so `next/image` can render them.

Tests added: `tests/unit/user-menu.test.tsx` (avatar/fallback rendering, open/close via click/
Escape/outside-click) and `tests/unit/nav-links.test.tsx` (active-link state per route). Verified
with axe (0 violations on `/` and `/about`) and browser checks of nav/redirect behavior for
signed-out visitors. **Pending**: the signed-in avatar rendering (a real Google/GitHub profile image
showing correctly in the nav) still needs a manual check by the project owner — automated browser
tools can't drive a real Google/GitHub sign-in (research.md §6).

**2026-07-04 (same day) — Nav branding and spacing pass.** Follow-up polish on the nav bar above:
- Brand text changed from "Decision Journal" to "Jon Upchurch Showcase" in `nav-bar.tsx` (the page
  `<title>`/metadata in `src/app/layout.tsx` is unchanged — still "Decision Journal" — since that's
  the product name for SEO/tab purposes, distinct from the nav's personal-portfolio framing).
- A vertical divider (`border-l`, decorative/`aria-hidden`) added between the brand and the nav
  links, with the same `gap-4` (16px) spacing on both sides.
- `NavLinks`' internal item spacing changed from `gap-6` to `gap-4` to match that same rhythm, and
  a `flex-1` spacer added so the brand/divider/links cluster stays left-aligned while the avatar/
  sign-in control stays pinned to the far right (previously `justify-between` spread all three
  groups across the bar).

Re-verified: 68/68 tests pass, axe still reports 0 violations on `/` and `/about`.
