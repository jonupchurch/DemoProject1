---

description: "Task list for Authentication via Google & GitHub SSO"
---

# Tasks: Authentication via Google & GitHub SSO

**Input**: Design documents from `/specs/002-auth-google-github/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-callbacks.md,
quickstart.md

**Tests**: Included and **mandatory** — constitution Principle II (NON-NEGOTIABLE) requires unit
coverage of business logic and integration coverage of user-facing flows, same override as phase 1.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

## Path Conventions

Single Next.js App Router project per plan.md — `src/`, `prisma/`, `tests/` at repository root.
`.env` already has `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET` populated (done earlier in conversation) — no setup task needed for that.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Add `next-auth@beta` and `@auth/prisma-adapter` as dependencies in `package.json`
      (research.md §1 — `next-auth`'s `latest` tag is still v4; v5 requires the `beta` tag
      explicitly)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, session/auth plumbing every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Extend `prisma/schema.prisma` per data-model.md: add `User`, `Account`, `Session`,
      `VerificationToken` models; remove `Owner`; retarget `Decision.ownerId`'s relation to `User`
      (field name unchanged)
- [X] T003 Run `npx prisma migrate dev --name add-auth` against dev, `npm run prisma:migrate:test`
      against the test database, then `npx prisma generate` (depends on T002)
- [X] T004 [P] Create `src/lib/session.ts` exposing `getCurrentUserId()` and
      `requireCurrentUserId()` per contracts/auth-callbacks.md
- [X] T005 Update `src/lib/decisions.ts` to call `src/lib/session.ts`'s `getCurrentUserId()` instead
      of the retired `getCurrentOwnerId()` (depends on T004; phase 1's research.md §5 anticipated
      this exact swap — no other changes to `decisions.ts` needed)
- [X] T006 [P] Delete `src/lib/owner.ts` (retired per data-model.md; depends on T005 landing first
      so nothing still imports it)
- [X] T007 Create `src/auth.config.ts`: Google and GitHub provider definitions (base config only,
      no adapter — must stay edge-safe per plan.md's Constraints) and the sign-in page path
- [X] T008 Create `src/auth.ts`: imports `auth.config.ts`, adds `PrismaAdapter(prisma)` and
      `session: { strategy: "jwt" }`, exports `auth`/`signIn`/`signOut`/`handlers` (depends on
      T002, T007)
- [X] T009 Create `src/app/api/auth/[...nextauth]/route.ts` exporting the `GET`/`POST` handlers
      from `src/auth.ts` (depends on T008)

**Checkpoint**: Schema and base Auth.js wiring exist. Sign-in isn't fully correct yet — GitHub
email verification and the linking decision (US1) still need to be wired into the `signIn`
callback.

---

## Phase 3: User Story 1 - Sign in with Google or GitHub (Priority: P1) 🎯 MVP (part 1 of 2)

**Goal**: A visitor can sign in with either provider; a first-time sign-in creates their account
correctly, including the verified-email linking decision (FR-001–FR-004) — there's no meaningful
smaller version of "sign in" that skips this, since the `signIn` callback has to decide
link-vs-create one way or another.

**Independent Test**: Choose "Continue with Google" (or GitHub), complete the provider's sign-in
flow, and confirm an account is created on first use and the person lands on their own decisions
list (spec.md US1).

### Tests for User Story 1 ⚠️ (write first, confirm they fail before implementing)

- [X] T010 [P] [US1] Unit test `getVerifiedGithubEmail` in `tests/unit/github-email.test.ts`:
      mocked `fetch` returning a primary+verified email, a primary+unverified email, and no emails
- [X] T011 [P] [US1] Unit test `verifiedEmailOrNull` in `tests/unit/auth-linking.test.ts`: verified
      email → returned as-is; unverified email → `null` (never trusted, FR-004); no email → `null`

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement `getVerifiedGithubEmail(accessToken)` in `src/lib/github-email.ts`
      per contracts/auth-callbacks.md
- [X] T013 [P] [US1] Implement the pure `verifiedEmailOrNull(email, verified)` in
      `src/lib/auth-linking.ts` per contracts/auth-callbacks.md
- [X] T014 [US1] Configure both providers in `src/auth.config.ts`: `allowDangerousEmailAccountLinking:
      true` on each (safe here — see research.md §5), Google's `profile()` returns
      `email: verifiedEmailOrNull(profile.email, profile.email_verified)`, GitHub's requests the
      `user:email` scope and its `profile()` returns `email: await getVerifiedGithubEmail(...)`
      (depends on T012, T013, T007)
- [X] T015 [US1] Create `src/auth.ts`'s remaining wiring beyond T008's scaffold if needed — confirm
      no additional `signIn` callback logic is required, since email-gating in T014 is what makes
      Auth.js's own adapter-driven linking safe (depends on T014, T008)
- [X] T016 [P] [US1] Build `sign-in-buttons.tsx` (Client Component calling `signIn("google")` /
      `signIn("github")`) in `src/components/auth/sign-in-buttons.tsx`
- [X] T017 [US1] Update `src/app/page.tsx`: check the session server-side; signed-out visitors see
      the sign-in prompt with `sign-in-buttons`, signed-in visitors are redirected to `/decisions`
      (depends on T015, T016)

**Checkpoint**: User Story 1 is fully functional — sign in with either provider works, and the
linking decision is correct from the start (not a later retrofit).

---

## Phase 4: User Story 2 - Decision data is private to the signed-in account (Priority: P1) 🎯 MVP (part 2 of 2)

**Goal**: Unauthenticated visitors are redirected away from every decision-related page, and no
account can reach another account's decisions — the actual delivery of constitution Principle III.

**Independent Test**: Two signed-in accounts each log a decision; confirm neither can see, edit,
resolve, or delete the other's decision, and a signed-out visitor is redirected away from every
decision page (spec.md US2).

### Tests for User Story 2 ⚠️ (write first, confirm they fail before implementing)

- [X] T018 [P] [US2] Unit test `src/lib/session.ts` in `tests/unit/session.test.ts` (mocking
      `auth()` from `src/auth.ts`): `getCurrentUserId` returns `null` with no session and the id
      with one; `requireCurrentUserId` redirects when there's no session
- [X] T019 [P] [US2] Integration test cross-account isolation in
      `tests/integration/auth-access.test.ts` (mocking `getCurrentUserId` per test to switch
      between two seeded users): confirm `listDecisions`/`getDecision` never return another
      account's data

### Implementation for User Story 2

- [X] T020 [US2] Create `src/proxy.ts` — edge fast-path redirect to the sign-in prompt for
      unauthenticated requests to decision routes, importing only from `src/auth.config.ts`
      (depends on T007; MUST NOT import `src/auth.ts` or `@prisma/client` — plan.md Constraints)
- [X] T021 [US2] Create `src/app/decisions/layout.tsx` calling `requireCurrentUserId()` before
      rendering any child route — the actual enforcement point per CVE-2025-29927 (depends on T004)

**Checkpoint**: User Stories 1 and 2 together are the MVP of this phase — sign-in works and
decision data is genuinely private, enforced at both the edge and the server-component level.

---

## Phase 5: User Story 3 - Signing in with a second linked provider reaches the same account (Priority: P2)

**Goal**: Confirm the linking mechanism built in User Story 1 actually behaves correctly end to
end — no new implementation, since there's no smaller/separate version of "sign in" that omits the
linking decision (research.md §5 covers why this was built once, correctly, in US1).

**Independent Test**: Sign in with Google, log a decision, sign out, sign in with GitHub using a
verified email matching the Google account's — confirm the previously logged decision is visible
(spec.md US3).

### Tests for User Story 3 ⚠️ (write first, confirm they fail before implementing)

- [X] T022 [P] [US3] Integration test in `tests/integration/auth-adapter.test.ts` exercising
      `@auth/prisma-adapter`'s `PrismaAdapter` directly against the test database: create a `User`
      via `adapter.createUser` + `adapter.linkAccount` for provider A; call `adapter.getUserByEmail`
      with the same email and confirm it finds that `User`; call `adapter.linkAccount` for provider
      B against that same user id and confirm `adapter.getUserByAccount` for provider B resolves to
      the same user. This proves our schema/adapter setup supports the linking Auth.js will perform
      at the real `email`-gated sign-in (T014) — the gating logic itself is already unit-tested in
      US1.

**Checkpoint**: Linking is verified correct at two levels — the email-gating decision (unit-tested
in US1) and the adapter/schema mechanics that act on it (integration-tested here).

---

## Phase 6: User Story 4 - Sign out (Priority: P2)

**Goal**: A signed-in person can end their session and is treated as signed-out immediately
afterward.

**Independent Test**: Sign in, choose sign out, confirm the signed-out sign-in prompt appears and
revisiting a decision page (e.g. via back button) redirects to sign-in (spec.md US4).

### Tests for User Story 4 ⚠️ (write first, confirm they fail before implementing)

- [X] T023 [P] [US4] Component test for `sign-out-button.tsx` in
      `tests/unit/sign-out-button.test.tsx` (React Testing Library, mocking `next-auth/react`'s
      `signOut`): confirm clicking the button calls `signOut()`

### Implementation for User Story 4

- [X] T024 [P] [US4] Build `sign-out-button.tsx` (Client Component calling `signOut()`) in
      `src/components/auth/sign-out-button.tsx`
- [X] T025 [US4] Add a minimal header to `src/app/decisions/layout.tsx` showing the sign-out
      control (depends on T021, T024)

**Checkpoint**: All four user stories are functional independently.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T026 [P] Run an automated accessibility check (axe) against the sign-in prompt (`/`) and fix
      any violations (constitution Principle IV)
- [X] T027 [P] Run Lighthouse against `/` (signed-out) in a production build; compare against phase
      1's documented Performance baseline/exception (constitution Principle VII)
- [X] T028 Manually verify quickstart.md scenarios 1-4 using real Google/GitHub OAuth consent
      screens — this cannot be automated (research.md §6); run through it together interactively
- [X] T029 [P] Review `src/auth.config.ts`, `src/auth.ts`, `src/proxy.ts`, `src/lib/session.ts`,
      `src/lib/auth-linking.ts`, and `src/lib/github-email.ts` for strict TypeScript compliance
      with no `any` (constitution Principle I)
- [X] T030 Confirm `src/proxy.ts`'s import chain never reaches `src/auth.ts` or `@prisma/client`
      (plan.md Constraints) — verify with a production build, which fails loudly if the edge
      bundle can't resolve a Node-only dependency

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; in practice needs User Story 1 (a real
  sign-in) to have accounts to isolate, but its own logic/tests (session checks, cross-account
  denial) are independent
- **User Story 3 (Phase 5)**: Depends on User Story 1's email-gating (T014) already existing — this
  phase only adds adapter/schema-level validation, no new implementation
- **User Story 4 (Phase 6)**: Depends on Foundational and User Story 1 (need to be signed in to
  sign out) and User Story 2 (shares `decisions/layout.tsx`)
- **Polish (Final Phase)**: Depends on all four user stories being complete

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation (constitution Principle II)
- Pure functions (`verifiedEmailOrNull`, `getVerifiedGithubEmail`) before the provider config that
  calls them, before the UI
- Story complete and checkpointed before moving to the next priority

### Parallel Opportunities

- T010–T011 (US1 tests) can run in parallel with each other
- T012–T013 (US1 pure-function implementations) can run in parallel with each other
- T018–T019 (US2 tests) can run in parallel with each other
- T004 and T007 (Foundational) have no dependency on each other and can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

Both are P1 — together they form the actual security delivery of this phase (sign in works, and
decision data is genuinely private). Neither alone is complete: US1 without US2 would mean anyone
could still reach anyone's decisions; US2 without US1 has no accounts to isolate in the first
place.

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: run quickstart.md scenarios 1–2 with real Google/GitHub sign-in
6. This is the MVP — every decision now genuinely belongs to a real, isolated account

### Incremental Delivery

1. Setup + Foundational → schema and base Auth.js wiring ready
2. User Story 1 → validate sign-in and linking correctness
3. User Story 2 → validate privacy/isolation → **MVP complete**
4. User Story 3 → validate the linking mechanism end-to-end (no new code)
5. User Story 4 → validate sign-out
6. Final Phase → accessibility/performance pass, manual OAuth walkthrough, cleanup

---

## Notes

- `[P]` tasks touch different files with no unmet dependencies
- `[Story]` labels map tasks back to spec.md for traceability
- Tests are mandatory here (constitution override of the template default) — write them first,
  confirm failure, then implement
- OAuth consent screens are never automated in this project's test suite — manual verification
  (T029) is the deliberate, documented approach (research.md §6)
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before continuing
