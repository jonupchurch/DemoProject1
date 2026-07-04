# Phase 0 Research: Authentication via Google & GitHub SSO

## 1. Auth library

**Decision**: Auth.js v5 (`next-auth@beta` on npm — as of this writing, `latest` still resolves to
v4.24.14; v5 is only published under the `beta` dist-tag, currently `5.0.0-beta.31`), with
`@auth/prisma-adapter`.

**Rationale**: Confirmed with the project owner earlier — direct OAuth rather than a hosted provider
like Clerk, to keep all user data in our own Postgres database and avoid an added external
dependency/cost. Auth.js v5 is the version built for Next.js App Router (route handlers, `auth()`
helper usable in Server Components, edge-compatible config split) rather than v4's older
`getServerSession`-based patterns.

**Alternatives considered**: Clerk (rejected earlier, see spec.md context — external service
dependency, data split across two systems). NextAuth v4 (rejected — designed around the Pages
Router/`getServerSession`, not the App Router primitives this codebase already uses).

## 2. Edge/Node split: `auth.config.ts`, `auth.ts`, `proxy.ts`

**Decision**: Three files, not one. `auth.config.ts` holds providers, pages config, and the
`authorized()` callback — no Prisma import, safe for edge. `auth.ts` imports that config, adds
`PrismaAdapter` and `session: { strategy: "jwt" }`, and is only ever imported from Node-runtime code
(the route handler, Server Components). `proxy.ts` — Next.js 16's renamed `middleware.ts` — imports
only from `auth.config.ts`.

**Rationale**: This isn't a stylistic choice; it's required. Vercel's Edge runtime (where
`proxy.ts` executes) cannot run Prisma's Node-native query engine or the `pg` driver — importing
`auth.ts` from `proxy.ts` would pull that dependency chain into the edge bundle and fail, the exact
failure mode phase 1 already hit once with a Client Component accidentally importing
`src/lib/decisions.ts`. JWT session strategy is required alongside this split because the edge proxy
needs to verify a session without a database round trip; database sessions would defeat the purpose
of having an edge-compatible proxy at all.

**Alternatives considered**: Database sessions — rejected, incompatible with an edge proxy needing
to verify a session without DB access. A single unsplit config file — rejected, would break at
edge-runtime import time, not silently; better to structure around the constraint from the start.

## 3. Proxy-only protection is insufficient (CVE-2025-29927)

**Decision**: `proxy.ts` provides a fast-path redirect for unauthenticated requests, but it is
**not** the actual enforcement boundary. Every protected layout/page (`src/app/decisions/layout.tsx`
and friends) independently calls the session-check helper server-side before touching any decision
data.

**Rationale**: CVE-2025-29927 demonstrated that Next.js middleware-based auth checks can be bypassed
by spoofing the `x-middleware-subrequest` header, meaning an attacker could reach a "protected" page
without ever passing through the middleware's logic. Constitution Principle III (Privacy & Data
Ownership) is NON-NEGOTIABLE, so relying solely on a bypassable mechanism to enforce it is not
acceptable — the real enforcement has to happen at the point where data is actually fetched.

**Alternatives considered**: Relying on `proxy.ts` alone — rejected outright given the CVE; this
would be exactly the kind of "code structured correctly but not actually secure in practice"
Principle III's phase-1 interim note already worried about at the deployment level.

## 4. GitHub email verification

**Decision**: Configure the GitHub provider with the `user:email` scope and a custom profile step
that calls `GET https://api.github.com/user/emails` (authenticated with the OAuth access token),
then selects the email where `primary: true AND verified: true`. If no such email exists, treat the
sign-in as having no verified email (never link, per FR-004). Google's standard OIDC profile's
`email_verified` boolean is used as-is — Google's verification is reliable by default.

**Rationale**: GitHub's default `/user` profile endpoint does not reliably expose accurate
verification status — some accounts return a null email entirely (private-by-default), and the
verification flag on the base profile does not consistently reflect GitHub's real per-email
verified state. Trusting it directly would violate FR-004 ("MUST NOT link accounts based on an
email address that is not verified by the provider") in exactly the scenario it exists to prevent.

**Alternatives considered**: Using GitHub's base profile email directly — rejected, this is the
specific gap FR-004 is guarding against. Skipping GitHub email verification entirely (never link
GitHub sign-ins to anything) — rejected, since spec.md's User Story 3 explicitly wants linking to
work when the email genuinely is verified; giving up on GitHub linking entirely would under-deliver
the spec, not just take a simpler path.

## 5. Account-linking mechanism

**Decision (revised after further research — see below)**: Enable
`allowDangerousEmailAccountLinking: true` on both providers, and make it *safe* to do so by
controlling what `email` value Auth.js ever sees in the first place. Each provider's custom
`profile()` callback returns `email: null` whenever the email isn't verified, and the real email
only when it is:
- **Google**: `email: profile.email_verified ? profile.email : null`.
- **GitHub**: `email: await getVerifiedGithubEmail(accessToken)` (§4 — already returns the verified
  email or `null`).

A small pure helper, `verifiedEmailOrNull(email, verified)` in `src/lib/auth-linking.ts`, expresses
the Google-side gating logic and is unit-tested directly (constitution Principle II) — this is the
one piece of custom logic FR-003/FR-004 actually depend on; the rest of the linking mechanism itself
is Auth.js's own tested adapter code, not ours to re-implement.

**Original approach considered and rejected**: A fully custom `signIn` callback that looks up an
existing `User` by email and manually calls the Prisma adapter's `createUser`/`linkAccount` to
perform the linking ourselves, bypassing Auth.js's built-in email-linking path entirely. Rejected
after research turned up no clearly documented way to have a `signIn` callback reliably override
*which* user id Auth.js's subsequent internal adapter calls attach the new `Account` to — building
this without a confirmed, stable extension point risked either duplicating work Auth.js's adapter
already does correctly, or subtly fighting its internal sequencing. Controlling the `email` field
Auth.js sees is a documented, supported customization point (the `profile()` callback), and
`allowDangerousEmailAccountLinking` combined with an already-verified-only email is exactly the
"provider you've verified handles email verification correctly" case Auth.js's own docs describe as
the safe use of that flag — because by the time Auth.js sees the email, we've already done that
verification ourselves.

**Alternatives considered**: Leaving `allowDangerousEmailAccountLinking` off entirely (never link
automatically) — rejected, spec.md's User Story 3 explicitly wants linking to work for genuinely
verified, matching emails.

## 6. Testing OAuth flows

**Decision**: Unit-test the linking decision (§5) and GitHub email extraction (§4) as plain
functions with mock inputs. Integration-test route protection by calling the shared session-check
helper directly (the same one the real pages call), simulating authenticated/unauthenticated and
same-account/cross-account scenarios against the test database. Do not attempt to automate a real
Google/GitHub OAuth consent screen; `quickstart.md` documents that as a manual verification step.

**Rationale**: This mirrors phase 1's approach of testing business logic directly rather than only
through the UI, and is standard practice for OAuth — actually driving a third-party consent screen
in CI is neither reliable nor something this project's scope calls for.

**Alternatives considered**: End-to-end browser automation against real Google/GitHub sign-in pages
— rejected as brittle (third-party UI changes, CAPTCHA/bot-detection, requires real test-provider
accounts) and disproportionate for a project of this scope.
