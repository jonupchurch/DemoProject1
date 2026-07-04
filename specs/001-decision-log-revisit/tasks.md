---

description: "Task list for Core Decision Logging & Revisit/Resolve Flow"
---

# Tasks: Core Decision Logging & Revisit/Resolve Flow

**Input**: Design documents from `/specs/001-decision-log-revisit/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: Included and **mandatory**, not optional — constitution Principle II ("Extensive Test
Coverage", NON-NEGOTIABLE) requires unit coverage of all business logic and integration coverage
of every user-facing flow for this project, overriding the template's default of treating tests as
optional.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

## Path Conventions

Single Next.js App Router project per plan.md — `src/`, `prisma/`, `tests/` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the dependencies and tooling this feature needs on top of the existing Next.js scaffold

- [ ] T001 Add `prisma`, `@prisma/client`, `vitest`, `@testing-library/react`,
      `@testing-library/jest-dom`, and `jsdom` as dependencies in `package.json`
- [ ] T002 [P] Configure Vitest in `vitest.config.ts` (jsdom environment, `@/*` path alias matching
      `tsconfig.json`)
- [ ] T003 [P] Document `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` in `.env.example`
      (research.md §2)
- [ ] T004 [P] Run `npx prisma init` to create `prisma/schema.prisma` with the pooled/direct
      datasource pattern from research.md §2
- [ ] T005 [P] Add shared design tokens (spacing/type/color scale) to `src/app/globals.css` /
      Tailwind config per constitution Principle VI, reused by every later phase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Define `Owner`, `Decision`, and `Option` models (with `Category`/`Status` enums and the
      `ownerId`/`reviewDate`/`category` indexes) in `prisma/schema.prisma` per data-model.md
      (Resolution model is added later, in Phase 4 — only US2 needs it)
- [ ] T007 Run the initial migration: `npx prisma migrate dev --name init` (depends on T006)
- [ ] T008 [P] Create the Prisma client singleton in `src/lib/db.ts`
- [ ] T009 [P] Create `prisma/seed.ts` seeding a single `Owner` row; wire it into `package.json`'s
      `prisma.seed` config (depends on T006)
- [ ] T010 [P] Create `src/lib/owner.ts` exposing `getCurrentOwnerId()` per research.md §5
- [ ] T011 Update `src/app/page.tsx` to link to `/decisions` (shared entry point for every story)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Log a decision before making it (Priority: P1) 🎯 MVP (part 1 of 2)

**Goal**: Users can create a decision (title, one-or-more named options each with pros/cons, cost,
risks, notes, confidence, category, review date) and see it in a pending-status list/detail view.

**Independent Test**: Create a new decision entry with all fields and confirm it appears in the
decisions list with a "Pending" status (spec.md US1).

### Tests for User Story 1 ⚠️ (write first, confirm they fail before implementing)

- [ ] T012 [P] [US1] Unit test decision validation (confidence 0–100 range, at least one option
      required, required-field checks) in `tests/unit/decisions.test.ts`
- [ ] T013 [P] [US1] Integration test `createDecision` against a real test database in
      `tests/integration/decisions-actions.test.ts`

### Implementation for User Story 1

- [ ] T014 [US1] Implement `createDecision`, `listDecisions`, `getDecision` in
      `src/lib/decisions.ts` per contracts/server-actions.md (depends on T006–T010)
- [ ] T015 [US1] Implement the `createDecision` Server Action in `src/actions/decisions.ts`,
      enforcing FR-002/FR-013 validation (depends on T014)
- [ ] T016 [P] [US1] Build `decision-form` (dynamic option rows, each with name/pros/cons) in
      `src/components/decisions/decision-form.tsx`
- [ ] T017 [US1] Build the new-decision page in `src/app/decisions/new/page.tsx` using
      `decision-form` + the `createDecision` action (depends on T015, T016)
- [ ] T018 [US1] Build the decisions list page (Server Component) in `src/app/decisions/page.tsx`
      using `listDecisions` (depends on T014)
- [ ] T019 [US1] Build the decision detail page (Server Component) in
      `src/app/decisions/[id]/page.tsx` using `getDecision` (depends on T014)
- [ ] T020 [US1] Add empty-state guidance to `src/app/decisions/page.tsx` for zero logged decisions
      (edge case, spec.md)

**Checkpoint**: User Story 1 is fully functional and testable independently — decisions can be
created, listed, and viewed.

---

## Phase 4: User Story 2 - Resolve a decision and learn from it (Priority: P1) 🎯 MVP (part 2 of 2)

**Goal**: Users can resolve a pending decision (verdict, satisfaction score, learnings), locking its
original entry, and later correct the resolution itself.

**Independent Test**: Resolve an existing pending decision and confirm its status becomes
"Resolved" with the original entry now locked (spec.md US2).

### Tests for User Story 2 ⚠️ (write first, confirm they fail before implementing)

- [ ] T021 [P] [US2] Unit test resolution validation and locking rules (satisfaction 1–5 range,
      resolved-entry immutability, already-resolved routes to edit) in
      `tests/unit/decisions.test.ts`
- [ ] T022 [P] [US2] Integration test `resolveDecision` and `updateResolution` against a real test
      database in `tests/integration/decisions-actions.test.ts`

### Implementation for User Story 2

- [ ] T023 [US2] Add the `Resolution` model to `prisma/schema.prisma` per data-model.md and run
      `npx prisma migrate dev --name add-resolution`
- [ ] T024 [US2] Extend `src/lib/decisions.ts` with `resolveDecision`/`updateResolution`, enforcing
      immutability of a resolved decision's original entry (depends on T023, T014)
- [ ] T025 [US2] Implement the `resolveDecision`/`updateResolution` Server Actions in
      `src/actions/decisions.ts` per contracts/server-actions.md (depends on T024)
- [ ] T026 [P] [US2] Build `resolve-form` (verdict/satisfaction/learnings) in
      `src/components/decisions/resolve-form.tsx`
- [ ] T027 [US2] Wire resolve / edit-resolution entry points into
      `src/app/decisions/[id]/page.tsx` (depends on T025, T026)
- [ ] T028 [US2] Render a resolved decision's original entry as read-only in
      `src/app/decisions/[id]/page.tsx` (depends on T027)

**Checkpoint**: User Stories 1 and 2 together form the MVP — the full log → resolve loop works
end to end.

---

## Phase 5: User Story 3 - Browse decision history (Priority: P2)

**Goal**: All decisions (pending and resolved) are visible in the list and open to full detail,
including resolution info once resolved.

**Independent Test**: Log several decisions in a mix of states and confirm all are visible in the
list, each opening to its full detail (spec.md US3).

### Tests for User Story 3 ⚠️ (write first, confirm they fail before implementing)

- [ ] T029 [P] [US3] Integration test confirming `listDecisions` returns both pending and resolved
      decisions, and `getDecision` includes resolution data when present, in
      `tests/integration/decisions-actions.test.ts`

### Implementation for User Story 3

- [ ] T030 [US3] Ensure `src/app/decisions/page.tsx` shows each decision's status and flags
      decisions whose review date has arrived or passed (FR-006) (depends on T018)
- [ ] T031 [US3] Ensure `src/app/decisions/[id]/page.tsx` renders resolution details when present
      (depends on T019, T027)

**Checkpoint**: User Stories 1, 2, and 3 are all functional independently.

---

## Phase 6: User Story 4 - Edit or delete a decision (Priority: P3)

**Goal**: Users can edit a still-pending decision's original entry, and delete any decision after
confirmation.

**Independent Test**: Edit a pending decision's fields and confirm they persist; delete a decision
(either status) and confirm it no longer appears anywhere (spec.md US4).

### Tests for User Story 4 ⚠️ (write first, confirm they fail before implementing)

- [ ] T032 [P] [US4] Unit test edit rejection on resolved decisions and the minimum-one-option rule
      on option removal, in `tests/unit/decisions.test.ts`
- [ ] T033 [P] [US4] Integration test `updateDecision` and `deleteDecision` against a real test
      database in `tests/integration/decisions-actions.test.ts`

### Implementation for User Story 4

- [ ] T034 [US4] Implement `updateDecision`/`deleteDecision` in `src/lib/decisions.ts` and their
      Server Actions in `src/actions/decisions.ts` per contracts/server-actions.md (depends on T014)
- [ ] T035 [P] [US4] Build the edit-decision page in `src/app/decisions/[id]/edit/page.tsx`,
      reusing `decision-form` (depends on T016, T034)
- [ ] T036 [US4] Add a delete-confirmation control wired to `deleteDecision` in
      `src/app/decisions/[id]/page.tsx` (depends on T034)

**Checkpoint**: All four user stories are functional independently.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T037 [P] Run an automated accessibility check (e.g. axe) against all `/decisions` pages and
      fix violations (constitution Principle IV)
- [ ] T038 [P] Run Lighthouse against `/decisions` and `/decisions/[id]` in a production build;
      tune until Performance and Accessibility both score 95+ (constitution Principle VII)
- [ ] T039 Replace the leftover scaffold metadata ("Typescript2" title/description) in
      `src/app/layout.tsx` with real values
- [ ] T040 Run every `quickstart.md` validation scenario end-to-end
- [ ] T041 [P] Review `src/lib/decisions.ts` and `src/actions/decisions.ts` for strict TypeScript
      compliance with no `any` (constitution Principle I)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; in practice needs decisions to exist
  (User Story 1) to resolve against, so build after US1 even though nothing schema-wise blocks it
- **User Story 3 (Phase 5)**: Depends on Foundational; reads data US1/US2 already expose
- **User Story 4 (Phase 6)**: Depends on Foundational; edits/deletes what US1 creates
- **Polish (Final Phase)**: Depends on all four user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — the true starting point
- **User Story 2 (P1)**: Practically sequenced after US1 (needs a decision to resolve), but its
  own logic/tests are independent
- **User Story 3 (P2)**: Builds on list/detail views US1 already created; adds status/overdue
  surfacing and resolution display
- **User Story 4 (P3)**: Builds on the create flow US1 established

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation (constitution Principle II)
- Data-access functions (`src/lib/decisions.ts`) before Server Actions before UI
- Story complete and checkpointed before moving to the next priority

### Parallel Opportunities

- T002–T005 (Setup) can run in parallel
- T008–T010 (Foundational) can run in parallel once T006/T007 complete
- Within each story, the `[P]`-marked test tasks can run in parallel with each other
- T016 (decision-form) has no dependency on T012–T015 and can be built in parallel with them

---

## Parallel Example: User Story 1

```bash
# Tests for User Story 1, in parallel:
Task: "Unit test decision validation in tests/unit/decisions.test.ts"
Task: "Integration test createDecision in tests/integration/decisions-actions.test.ts"

# decision-form has no upstream dependency within US1 and can be built alongside T014/T015:
Task: "Build decision-form in src/components/decisions/decision-form.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

Both are P1 in spec.md — together they form the actual "decision journal" loop (log, then learn
from the outcome). Neither alone is the real MVP; a log-only tool with no resolve step isn't this
product's core value proposition.

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: run quickstart.md scenarios 1–2 end-to-end
6. This is the MVP — deployable as a private/preview Vercel deployment per the constitution's
   Principle III note in plan.md (not public until phase 2's auth ships)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → validate independently
3. User Story 2 → validate independently → **MVP complete**
4. User Story 3 → validate independently
5. User Story 4 → validate independently
6. Final Phase → accessibility/performance/polish pass, then full quickstart.md re-run

---

## Notes

- `[P]` tasks touch different files with no unmet dependencies
- `[Story]` labels map tasks back to spec.md for traceability
- Tests are mandatory here (constitution override of the template default) — write them first,
  confirm failure, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before continuing
