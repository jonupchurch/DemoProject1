---

description: "Task list for Filtering, Search & Timeline"
---

# Tasks: Filtering, Search & Timeline

**Input**: Design documents from `/specs/004-filter-search-timeline/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/decision-queries.md,
quickstart.md

**Tests**: Included and **mandatory** — constitution Principle II (NON-NEGOTIABLE) requires unit
coverage of business logic and integration coverage of user-facing flows, same override as
phases 1-3.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)

## Path Conventions

Single Next.js App Router project per plan.md — `src/`, `tests/` at repository root. No new
dependencies or schema migrations needed for this feature (unlike phases 2-3), so there is no
separate Setup phase — work begins directly at Foundational.

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: The two small, atomic pieces every user story builds on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 [P] Add `DecisionFilters` type and `parseDecisionFilters(searchParams)` in
      `src/lib/decision-filters.ts` per contracts/decision-queries.md — parses `category`,
      `status`, `verdict`, and `q` all at once; unknown/invalid values ignored, whitespace-only
      `q` becomes `undefined`
- [ ] T002 [P] Add `countDecisions()` to `src/lib/decisions.ts` — `prisma.decision.count({ where:
      { ownerId } })` via `requireCurrentUserId()`, per data-model.md

**Checkpoint**: URL parsing and the total-count query exist. `listDecisions()` itself doesn't
filter anything yet — nothing user-visible has changed.

---

## Phase 2: User Story 1 - Filter the decisions list (Priority: P1) 🎯 MVP

**Goal**: A signed-in user can filter `/decisions` by category, status, and verdict, combined,
with a way to clear them.

**Independent Test**: Log decisions across categories/statuses/verdicts; apply each filter type
and combinations; confirm only matching decisions appear, and clearing filters restores the full
list (spec.md US1).

### Tests for User Story 1 ⚠️ (write first, confirm they fail before implementing)

- [ ] T003 [P] [US1] Unit test `parseDecisionFilters`'s category/status/verdict parsing in
      `tests/unit/decision-filters.test.ts`: single value, multiple values, and an
      unknown/invalid value being ignored rather than erroring, for each of the three fields
- [ ] T004 [P] [US1] Integration test `listDecisions(filters)` in
      `tests/integration/decision-filtering.test.ts`: filtering by one category, by one status,
      by a verdict (confirming Pending decisions are excluded), and by a combined category+status
      filter (FR-001–FR-004); confirm ownership scoping is unaffected

### Implementation for User Story 1

- [ ] T005 [US1] Extend `listDecisions()` in `src/lib/decisions.ts` to accept an optional
      `DecisionFilters` parameter and apply the `category`/`status`/`resolution.verdict` `where`
      clauses per data-model.md (depends on T001; T004 must fail first)
- [ ] T006 [P] [US1] Build `DecisionFilterControls` (category/status/verdict checkboxes + a
      "Clear filters" control) in `src/components/decisions/decision-filter-controls.tsx` —
      `"use client"`, reads `useSearchParams()`, writes via `router.replace()` against
      `usePathname()`
- [ ] T007 [US1] Update `src/app/decisions/page.tsx`: read `searchParams`, call
      `parseDecisionFilters`, then `listDecisions(filters)` and `countDecisions()`; render
      `DecisionFilterControls` plus the list, the existing phase 1 "no decisions yet" empty
      state, or the new FR-008 "no matches" state (depends on T002, T005, T006)

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 3: User Story 2 - Search decisions by keyword (Priority: P2)

**Goal**: A signed-in user can search `/decisions` by keyword across title/risks/notes/learnings,
combined with any active filters.

**Independent Test**: Log a decision with distinctive words in each of its title, risks, notes,
and (once resolved) learnings; search for each word and confirm the decision is found every time;
confirm a nonsense search shows a clear "no matches" message (spec.md US2).

### Tests for User Story 2 ⚠️ (write first, confirm they fail before implementing)

- [ ] T008 [P] [US2] Unit test `parseDecisionFilters`'s search parsing in
      `tests/unit/decision-filters.test.ts`: a normal term is trimmed and kept; an empty or
      whitespace-only `q` becomes `undefined` (edge case, spec.md)
- [ ] T009 [P] [US2] Integration test `listDecisions(filters)` search in
      `tests/integration/decision-filtering.test.ts`: a term matching only in `title`, only in
      `risks`, only in `notes`, and only in a resolved decision's `learnings`, each found
      correctly (FR-006); a search term combined with an active category filter narrows to the
      intersection (FR-007); a nonsense term returns an empty result

### Implementation for User Story 2

- [ ] T010 [US2] Extend `listDecisions()` in `src/lib/decisions.ts` to also apply the
      case-insensitive `OR` search clause across `title`/`risks`/`notes`/`resolution.learnings`
      when `filters.search` is set (depends on T005; T009 must fail first)
- [ ] T011 [P] [US2] Build `DecisionSearchInput` in
      `src/components/decisions/decision-search-input.tsx` — `"use client"`, same
      `useSearchParams()`/`router.replace()` pattern as `DecisionFilterControls`, writing the `q`
      param
- [ ] T012 [US2] Update `src/app/decisions/page.tsx` to render `DecisionSearchInput` alongside
      `DecisionFilterControls` (depends on T007, T010, T011)

**Checkpoint**: User Stories 1 and 2 both work together — filtering and search combine correctly.

---

## Phase 4: User Story 3 - View decisions on a timeline (Priority: P3)

**Goal**: A signed-in user can view their decisions in chronological order (by review date while
Pending, by resolution date once Resolved), with the same filters/search available.

**Independent Test**: Log decisions with a mix of past/future review dates and resolved/pending
status; confirm the timeline orders them correctly and visually distinguishes status/verdict
(spec.md US3).

### Tests for User Story 3 ⚠️ (write first, confirm they fail before implementing)

- [ ] T013 [P] [US3] Unit test `sortDecisionsForTimeline` in `tests/unit/timeline.test.ts`:
      Pending decisions ordered by `reviewDate`, Resolved decisions ordered by
      `resolution.resolvedAt`, a mixed set ordered correctly overall (most-recent-first), a
      same-date tie broken stably by `createdAt`, and `[]` in → `[]` out

### Implementation for User Story 3

- [ ] T014 [US3] Implement `sortDecisionsForTimeline(decisions)` in `src/lib/timeline.ts` per
      contracts/decision-queries.md (T013 must fail first)
- [ ] T015 [US3] Create `src/app/decisions/timeline/page.tsx`: same `searchParams`
      parsing/`countDecisions()`/empty-state pattern as `/decisions`, piping `listDecisions(
      filters)` through `sortDecisionsForTimeline`; renders `DecisionFilterControls` +
      `DecisionSearchInput` (reused unmodified) + the timeline view, using the existing phase 1
      status/verdict badge styles (FR-010) (depends on T006, T010, T011, T014)
- [ ] T016 [US3] Add a "Timeline" link to
      `src/components/decisions/decisions-subnav.tsx`, alongside the existing "My Decisions" /
      "Dashboard" entries

**Checkpoint**: All three user stories are independently functional — filtering, search, and the
timeline all work, individually and combined.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Run an automated accessibility check (axe) against `/decisions` (with filters/
      search active) and `/decisions/timeline`, in empty-state, no-matches, and populated states;
      fix any violations (constitution Principle IV)
- [ ] T018 [P] Run Lighthouse against production builds of `/decisions` and
      `/decisions/timeline`; record Performance/Accessibility scores (constitution Principle VII)
- [ ] T019 [P] Review `src/lib/decision-filters.ts`, `src/lib/timeline.ts`, the extended
      `src/lib/decisions.ts`, and the new components for strict TypeScript compliance with no
      `any` (constitution Principle I)
- [ ] T020 Manually walk through quickstart.md scenarios 1-13
- [ ] T021 Update `specs/004-filter-search-timeline/plan.md`'s Constitution Check with the actual
      measured Lighthouse scores from T018, mirroring how phases 1-3 documented theirs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately; BLOCKS all user stories
- **User Story 1 (Phase 2)**: Depends on Foundational only
- **User Story 2 (Phase 3)**: Depends on Foundational and on US1's `listDecisions()` extension
  (T005) already existing, since it extends the same function rather than creating a parallel one
- **User Story 3 (Phase 4)**: Depends on US1's and US2's filter/search UI components (reused
  unmodified) and on `listDecisions(filters)` already supporting every field
- **Polish (Final Phase)**: Depends on all three user stories being complete

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation (constitution Principle II)
- Parsing/query logic before the UI components that depend on it, before wiring the page
- Story complete and checkpointed before moving to the next priority

### Parallel Opportunities

- T001–T002 (Foundational) touch different files and can run in parallel
- T003–T004 (US1 tests) can run in parallel with each other
- T008–T009 (US2 tests) can run in parallel with each other
- T006 (`DecisionFilterControls`) and T011 (`DecisionSearchInput`) touch different files and can
  run in parallel with each other once their respective story's query support lands

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational
2. Complete Phase 2: User Story 1
3. **STOP and VALIDATE**: run quickstart.md scenarios 1-5
4. This is the MVP — a growing decisions list is usable again via filtering

### Incremental Delivery

1. Foundational → URL parsing and count query ready
2. User Story 1 → validate filtering → MVP
3. User Story 2 → validate search combined with filtering
4. User Story 3 → validate the timeline and its shared filter/search behavior
5. Final Phase → accessibility/performance pass, quickstart walkthrough, cleanup

---

## Notes

- `[P]` tasks touch different files with no unmet dependencies
- `[Story]` labels map tasks back to spec.md for traceability
- Tests are mandatory here (constitution override of the template default) — write them first,
  confirm failure, then implement
- Like phase 3, US2 and US3 here extend the same shared function (`listDecisions`) and reuse the
  same UI components US1 creates, rather than each building a parallel implementation — the spec
  frames filtering, search, and the timeline as complementary ways to view one underlying dataset
- FR-011 (filters apply consistently to both views) is satisfied by construction — both routes
  share the exact same `parseDecisionFilters`/`listDecisions(filters)` functions — verified via
  quickstart.md scenario 11 rather than a separate automated test
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before continuing
