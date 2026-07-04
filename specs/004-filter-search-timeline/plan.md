# Implementation Plan: Filtering, Search & Timeline

**Branch**: `004-filter-search-timeline` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-filter-search-timeline/spec.md`

## Summary

Add filtering (category/status/verdict), keyword search (title/risks/notes/learnings), and a
chronological timeline view on top of the existing decisions list, all as read-only query
variations over the existing `Decision`/`Resolution` data — no schema changes, no new
dependencies. Filter/search state lives in the URL's search params, parsed by one shared pure
function used identically by both `/decisions` (list) and the new `/decisions/timeline` route, so
filtering behaves consistently across both views (FR-011) without duplicating query logic. The
timeline's mixed ordering rule (by review date while Pending, by resolution date once Resolved) is
computed in application code after a normal fetch, the same simplicity-over-SQL-cleverness
approach phase 3's calibration aggregation used.

## Technical Context

**Language/Version**: TypeScript 5.x strict, Next.js 16 (App Router) / React 19 — unchanged from
phases 1-3

**Primary Dependencies**: None new. Reuses the existing Next.js/Prisma/`@prisma/adapter-pg`/
Tailwind stack as-is.

**Storage**: Same Postgres database, no schema changes. Filtering, search, and the timeline are
read-only query variations over the existing `Decision`, `Option`, and `Resolution` tables from
phase 1.

**Testing**: Vitest, extending the existing suite. `parseDecisionFilters` and
`sortDecisionsForTimeline` are pure functions and get full unit coverage (Principle II).
`listDecisions`'s extended filtering/search behavior and the new `countDecisions` get integration
tests per filter dimension, per searchable field, in combination, and for ownership scoping.

**Target Platform**: Vercel serverless (Node runtime) — unchanged.

**Project Type**: Web application — same single Next.js project, no new services.

**Performance Goals**: Same Lighthouse 95+ Performance/Accessibility targets (Principle VII). No
new client-side dependency is introduced this phase (unlike phase 3's Recharts), so no unusual
risk to this gate is expected beyond the already-documented framework-level baseline.

**Constraints**:
- **Filter/search state lives in URL search params**, not client-side component state. The list
  and timeline pages (Server Components) read `searchParams`, parse them with one shared pure
  function, and query with a Prisma `where` clause built from the result. Only the filter
  *controls* (checkboxes, search input) are a Client Component, which updates the URL via
  `router.replace()` — the actual data fetch stays server-side, per Principle I's Server-Component
  preference. This also means filtering behaves identically wherever `searchParams` are parsed,
  directly satisfying FR-011 without a second, parallel implementation.
- **Timeline ordering is computed in application code, not SQL**: a decision's "timeline date" is
  its `reviewDate` while Pending or its `resolution.resolvedAt` once Resolved — two different
  columns depending on status, which isn't a simple single-column `ORDER BY`. Given personal-tool
  data volumes (dozens to low hundreds of decisions, same assumption as phase 3), fetching the
  filtered set and sorting it in a small pure function is simpler and just as fast as raw SQL here.
- **Search is case-insensitive substring matching** via Prisma's `contains`/`mode: "insensitive"`
  (Postgres `ILIKE`-equivalent) across `title`, `risks`, `notes`, and `resolution.learnings` — no
  new search infrastructure, consistent with the spec's Assumptions.
- **Distinguishing "no decisions yet" from "no matches" (FR-008)** requires knowing the user's
  total unfiltered decision count alongside the filtered result set — a small dedicated
  `countDecisions()` query, not a second full fetch.

**Scale/Scope**: Unchanged single-user-at-a-time personal tool assumption from prior phases.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Type Safety & Simplicity** — PASS. `listDecisions()` gains an optional filters parameter
  rather than a parallel function; the timeline reuses the same query plus one small sort function.
  No new dependency, no speculative configurability beyond what the spec asks for (fixed filter
  dimensions, fixed search fields).
- **II. Extensive Test Coverage (NON-NEGOTIABLE)** — PASS (enforced in tasks). Pure functions
  (`parseDecisionFilters`, `sortDecisionsForTimeline`) get full unit coverage including edge cases
  (empty/whitespace search, tie-breaking). `listDecisions`'s filtering/search and `countDecisions`
  get integration tests per dimension, per field, combined, and for ownership scoping.
- **III. Privacy & Data Ownership (NON-NEGOTIABLE)** — PASS. Every new/extended query still goes
  through `requireCurrentUserId()` and filters by `ownerId` exactly like every existing query in
  `lib/decisions.ts`; filtering/search/timeline narrow *within* a user's own data, never across
  accounts (FR-012).
- **IV. WCAG 2.1 AA Accessibility (NON-NEGOTIABLE)** — PASS. Filter checkboxes and the search input
  get proper `<label>`s and full keyboard operability; the timeline reuses phase 1's existing
  text-plus-color status/verdict badge pattern (already WCAG-compliant, not color-only) rather than
  inventing a new indicator style. Verified with axe during implementation, as in prior phases.
- **V. Transparent AI Assistance** — N/A, no AI content in this phase.
- **VI. Clean, Elegant Design** — PASS. Filter bar and timeline reuse existing Tailwind design
  tokens and badge styles rather than introducing new visual patterns.
- **VII. Performance & Quality Bar (Lighthouse)** — **Measured**: both `/decisions` (populated,
  filters/search rendered) and `/decisions/timeline` (populated) scored Performance 82 /
  Accessibility 100 on a production build. This sits squarely within phases 1-3's already-
  documented 78-91 Performance range, confirming this is the same framework-level characteristic,
  not a regression — consistent with there being no new dependency this phase.

No unresolved violations against NON-NEGOTIABLE principles. Complexity Tracking table is
intentionally empty — no new dependencies or framework-forced patterns need justifying this phase.

## Project Structure

### Documentation (this feature)

```text
specs/004-filter-search-timeline/
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output — derived/computed shapes only (no new Prisma models)
├── quickstart.md              # Phase 1 output
└── contracts/
    └── decision-queries.md    # Phase 1 output — filter/search/timeline function signatures
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── decision-filters.ts        # NEW, pure: DecisionFilters type + parseDecisionFilters(
│   │                              # searchParams) -> DecisionFilters (shared by both routes)
│   ├── decisions.ts                # listDecisions() gains an optional DecisionFilters
│   │                              # parameter (category/status/verdict/search -> Prisma `where`);
│   │                              # add countDecisions() (FR-008's "no decisions vs no matches")
│   └── timeline.ts                 # NEW, pure: sortDecisionsForTimeline(decisions) ->
│                                   # DecisionWithDetails[], ordered by reviewDate (Pending) or
│                                   # resolution.resolvedAt (Resolved), most-recent-first, stable
│                                   # tie-break by createdAt
├── app/
│   └── decisions/
│       ├── page.tsx                 # updated: reads searchParams, parses filters, calls
│       │                           # listDecisions(filters) + countDecisions(); renders
│       │                           # DecisionFilterBar + list, or the FR-008 empty/no-match state
│       ├── layout.tsx / decisions-subnav.tsx  # subnav gains a "Timeline" entry
│       └── timeline/
│           └── page.tsx             # NEW: same filter parsing, listDecisions(filters) ->
│                                    # sortDecisionsForTimeline(); renders DecisionFilterBar +
│                                    # the timeline view (or the same FR-008 empty/no-match state)
└── components/
    └── decisions/
        └── decision-filter-bar.tsx  # NEW, Client Component ("use client"): category/status/
                                     # verdict checkboxes + search text input; reads current
                                     # values via useSearchParams(), writes via router.replace()
                                     # against the current pathname (so it works unmodified on
                                     # both /decisions and /decisions/timeline); includes a
                                     # "Clear filters" control (FR-005)

tests/
├── unit/
│   ├── decision-filters.test.ts    # parseDecisionFilters: empty/single/multi-value params,
│   │                              # whitespace-only search treated as no search (edge case)
│   └── timeline.test.ts            # sortDecisionsForTimeline: Pending-by-reviewDate,
│                                   # Resolved-by-resolvedAt, mixed ordering, tie-breaking
└── integration/
    └── decision-filtering.test.ts  # listDecisions(filters): each filter dimension, search
                                     # across each of the 4 fields, combined filters+search,
                                     # zero-match vs zero-total (countDecisions), ownership scoping
```

**Structure Decision**: Single Next.js App Router project, unchanged. `listDecisions()` is
extended rather than duplicated (existing callers that pass no filters are unaffected). The
timeline lives at `/decisions/timeline`, nested inside the Decision Journal app like phase 3's
dashboard — not a new top-level route, per the constitution's Multi-App Structure rule.

## Complexity Tracking

*No constitution violations require justification. Table intentionally left empty — no new
dependencies or framework-forced patterns this phase.*
