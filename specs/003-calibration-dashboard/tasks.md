---

description: "Task list for Calibration Dashboard"
---

# Tasks: Calibration Dashboard

**Input**: Design documents from `/specs/003-calibration-dashboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/dashboard-queries.md,
quickstart.md

**Tests**: Included and **mandatory** — constitution Principle II (NON-NEGOTIABLE) requires unit
coverage of business logic and integration coverage of user-facing flows, same override as phases
1-2.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)

## Path Conventions

Single Next.js App Router project per plan.md — `src/`, `tests/` at repository root. No new
environment variables or schema migrations needed for this feature.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Add `recharts` as a dependency and a `react-is` `overrides` entry in `package.json`
      (research.md §1 — Recharts' peer-dependency range lags React 19); run `npm install`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The raw data pipeline and route/nav shell every user story renders on top of

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Implement `scoreVerdict(verdict)` in `src/lib/calibration.ts` per
      contracts/dashboard-queries.md (Right→1, Wrong→0, Mixed→0.5)
- [ ] T003 [P] Implement `bucketConfidence(confidence)` in `src/lib/calibration.ts` per
      contracts/dashboard-queries.md (fixed bands: 0-20, 21-40, 41-60, 61-80, 81-100)
- [ ] T004 [P] Implement `listResolvedDecisionsForCalibration()` in `src/lib/decisions.ts` —
      narrow Prisma `select` (`confidence`, `category`, `resolution.verdict`,
      `resolution.satisfaction`), filtered to `status: "Resolved"` and `requireCurrentUserId()`
      (data-model.md, contracts/dashboard-queries.md)
- [ ] T005 Create the route shell `src/app/decisions/dashboard/page.tsx` calling
      `requireCurrentUserId()` directly (defense in depth, same CVE-2025-29927 pattern as every
      other `/decisions/*` page) — placeholder content until US1 wires real rendering (depends on
      T004)
- [ ] T006 Add an in-app sub-nav to `src/app/decisions/layout.tsx`: "My Decisions" (`/decisions`)
      and "Dashboard" (`/decisions/dashboard`) links, active-state aware like the existing
      `src/components/nav/nav-links.tsx` pattern — internal to this app, distinct from the
      site-wide showcase nav (plan.md Structure Decision)

**Checkpoint**: Raw data query, pure scoring/bucketing functions, the dashboard route, and its
in-app nav entry all exist. No aggregation or rendering yet — nothing to see in the browser.

---

## Phase 3: User Story 1 - See calibration by confidence level (Priority: P1) 🎯 MVP

**Goal**: A signed-in user with resolved decisions sees each populated confidence band's accuracy
rate and contributing count, in both an accessible table and a Recharts bar chart.

**Independent Test**: Resolve several decisions spanning different confidence levels with a mix
of Right/Wrong/Mixed verdicts; confirm the dashboard shows each populated band's accuracy rate and
count, with empty bands omitted (spec.md US1).

### Tests for User Story 1 ⚠️ (write first, confirm they fail before implementing)

- [ ] T007 [P] [US1] Unit test `scoreVerdict`/`bucketConfidence` boundary cases in
      `tests/unit/calibration.test.ts`: Right/Wrong/Mixed → 1/0/0.5; confidence values 0, 20, 21,
      40, 41, 60, 61, 80, 81, 100 each map to the correct band
- [ ] T008 [P] [US1] Unit test `aggregateCalibration`'s `byBand` grouping in
      `tests/unit/calibration.test.ts`: several decisions in one band produce the correct mean
      accuracy and count; a band with zero decisions is omitted (FR-006); `aggregateCalibration([])`
      returns `{ byBand: [], byCategory: [] }`
- [ ] T009 [P] [US1] Integration test `listResolvedDecisionsForCalibration` in
      `tests/integration/dashboard-data.test.ts`: returns only the signed-in owner's `Resolved`
      decisions; excludes that owner's `Pending` decisions and another owner's decisions entirely
      (FR-002, FR-009)

### Implementation for User Story 1

- [ ] T010 [US1] Implement `aggregateCalibration(decisions)`'s `byBand` grouping in
      `src/lib/calibration.ts` (depends on T002, T003; T007-T008 must fail first)
- [ ] T011 [P] [US1] Build `calibration-table.tsx` in
      `src/components/dashboard/calibration-table.tsx` — accessible `<table>` rendering `byBand`
      rows (label, accuracy %, count)
- [ ] T012 [P] [US1] Build `calibration-chart.tsx` in
      `src/components/dashboard/calibration-chart.tsx` (`"use client"`) — Recharts `BarChart`
      rendering `byBand` rows, styled with existing Tailwind design tokens (plan.md Constraints)
- [ ] T013 [US1] Wire `src/app/decisions/dashboard/page.tsx`: call
      `listResolvedDecisionsForCalibration()` → `aggregateCalibration()` → render
      `calibration-table` + `calibration-chart` with `byBand` data (depends on T005, T010, T011,
      T012)

**Checkpoint**: User Story 1 is fully functional and testable independently — confidence-band
calibration is visible end to end.

---

## Phase 4: User Story 2 - See calibration by category (Priority: P2)

**Goal**: The same accuracy/count breakdown, additionally grouped by category, alongside the
confidence-band view.

**Independent Test**: Resolve decisions across at least two categories; confirm each populated
category shows its own accuracy rate and count, with unused categories omitted (spec.md US2).

### Tests for User Story 2 ⚠️ (write first, confirm they fail before implementing)

- [ ] T014 [P] [US2] Unit test `aggregateCalibration`'s `byCategory` grouping in
      `tests/unit/calibration.test.ts`: several categories each produce the correct mean accuracy
      and count; a category with zero decisions is omitted (FR-006)

### Implementation for User Story 2

- [ ] T015 [US2] Extend `aggregateCalibration(decisions)` in `src/lib/calibration.ts` to also
      compute `byCategory`, ordered per `CATEGORIES` (`decision-types.ts`) (depends on T010; T014
      must fail first)
- [ ] T016 [US2] Extend `calibration-table.tsx` with a second section rendering `byCategory` rows
- [ ] T017 [US2] Extend `calibration-chart.tsx` with a second `BarChart` rendering `byCategory`
      rows
- [ ] T018 [US2] Update `src/app/decisions/dashboard/page.tsx` to pass `byCategory` through to both
      components (depends on T013, T015, T016, T017)

**Checkpoint**: User Stories 1 and 2 both work together — confidence-band and category calibration
are both visible.

---

## Phase 5: User Story 3 - Meaningful first-visit experience with little or no data (Priority: P3)

**Goal**: Zero resolved decisions produces a clear explanatory empty state instead of any
chart/table; a single-decision bucket still shows its count so it isn't mistaken for a trend.

**Independent Test**: View the dashboard as a signed-in user with zero resolved decisions and
confirm a clear empty-state message appears instead of charts (spec.md US3).

### Tests for User Story 3 ⚠️ (write first, confirm they fail before implementing)

- [ ] T019 [P] [US3] Component test in `tests/unit/dashboard-page.test.tsx`: given an empty
      `CalibrationSummary` (`{ byBand: [], byCategory: [] }`), the dashboard renders the FR-008
      empty-state message, not `calibration-table`/`calibration-chart`
- [ ] T020 [P] [US3] Unit test in `tests/unit/calibration.test.ts`: a bucket with `count: 1` still
      renders its count alongside the accuracy rate in `calibration-table.tsx` (regression guard
      for FR-007 on the single-data-point case)

### Implementation for User Story 3

- [ ] T021 [US3] Add the FR-008 empty-state branch and copy to
      `src/app/decisions/dashboard/page.tsx`: when both `byBand` and `byCategory` are empty,
      render an explanatory message instead of the table/chart (depends on T013, T018; T019 must
      fail first)

**Checkpoint**: All three user stories are independently functional — the dashboard handles rich
data, sparse data, and no data correctly.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T022 [P] Run an automated accessibility check (axe) against `/decisions/dashboard` in both
      the empty-state and populated states; fix any violations (constitution Principle IV)
- [ ] T023 [P] Run Lighthouse against `/decisions/dashboard` in a production build; record
      Performance/Accessibility scores — flag explicitly if Recharts' bundle weight pushes
      Performance below the 95 threshold and needs the documented-justification path (constitution
      Principle VII)
- [ ] T024 [P] Review `src/lib/calibration.ts`, the `listResolvedDecisionsForCalibration` addition
      to `src/lib/decisions.ts`, and the new dashboard components for strict TypeScript compliance
      with no `any` (constitution Principle I)
- [ ] T025 Manually walk through quickstart.md scenarios 1-5 (empty state, single-band population,
      cross-band/category spread including a Mixed verdict, Pending-decision exclusion, and
      own-data-only isolation across two accounts)
- [ ] T026 Update `specs/003-calibration-dashboard/plan.md`'s Constitution Check with the actual
      measured Lighthouse scores from T023, mirroring how phases 1-2 documented theirs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational and on US1's `aggregateCalibration`/
  `calibration-table`/`calibration-chart`/`page.tsx` already existing, since it extends each of
  them rather than creating parallel versions
- **User Story 3 (Phase 5)**: Depends on US1 and US2's `page.tsx` wiring existing, since the empty
  state is a branch inside that same page
- **Polish (Final Phase)**: Depends on all three user stories being complete

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation (constitution Principle II)
- Pure functions (`scoreVerdict`, `bucketConfidence`, `aggregateCalibration`) before the components
  that render their output, before wiring the page
- Story complete and checkpointed before moving to the next priority

### Parallel Opportunities

- T002–T004 (Foundational) touch different files and can run in parallel
- T007–T009 (US1 tests) can run in parallel with each other
- T011–T012 (US1 table/chart components) can run in parallel with each other once T010 lands
- T014 (US2 test) can be written in parallel with US1 work finishing up, though its implementation
  (T015) depends on T010

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md scenarios 2-3 (single-band and cross-band population)
5. This is the MVP — a user can already see whether their confidence was justified, by band

### Incremental Delivery

1. Setup + Foundational → data pipeline, route, and nav ready
2. User Story 1 → validate confidence-band calibration → MVP
3. User Story 2 → validate category calibration alongside it
4. User Story 3 → validate the empty-state and single-data-point experience
5. Final Phase → accessibility/performance pass, quickstart walkthrough, cleanup

---

## Notes

- `[P]` tasks touch different files with no unmet dependencies
- `[Story]` labels map tasks back to spec.md for traceability
- Tests are mandatory here (constitution override of the template default) — write them first,
  confirm failure, then implement
- Unlike phases 1-2's cleanly separable stories, US2 and US3 here extend the same functions/files
  US1 creates (`aggregateCalibration`, `calibration-table.tsx`, `calibration-chart.tsx`,
  `dashboard/page.tsx`) rather than adding parallel ones — the spec itself frames all three as
  lenses on one underlying aggregation, not independent subsystems
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before continuing
