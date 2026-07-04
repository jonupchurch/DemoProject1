# Contract: Filtering, Search & Timeline Functions

Internal function signatures (single Next.js app — "contract" means the boundary between URL
parsing, data access, and pure sorting/rendering, not a network API).

## `parseDecisionFilters(searchParams: URLSearchParams): DecisionFilters`

**Location**: `src/lib/decision-filters.ts`

- Reads `category`, `status`, `verdict` (each may repeat or be comma-separated — implementation
  detail, not user-facing) and `q` (search) from `searchParams`.
- Unknown/invalid enum values are ignored rather than erroring (defensive parsing — a stale or
  hand-edited URL should degrade gracefully, not break the page).
- A missing, empty, or whitespace-only `q` becomes `search: undefined` (edge case, spec.md).
- Pure function, no I/O, fully unit-testable with plain `URLSearchParams` instances.

## `listDecisions(filters?: DecisionFilters): Promise<DecisionWithDetails[]>`

**Location**: `src/lib/decisions.ts` (extends the existing phase 1 function)

- Calls `requireCurrentUserId()` internally, unchanged (FR-012).
- With no `filters` argument (or all fields empty/absent), behavior is unchanged from phase 1 —
  all of the current owner's decisions, in the existing `reviewDate` asc / `createdAt` desc order.
- With `filters` present, applies the `where` clause described in data-model.md; the result is
  still every field existing callers rely on (`options`, `resolution` included).

## `countDecisions(): Promise<number>`

**Location**: `src/lib/decisions.ts`

- Calls `requireCurrentUserId()` internally.
- Returns the current owner's *total* decision count, ignoring any filters — used only to
  distinguish "no decisions yet" from "no matches" (FR-008).

## `sortDecisionsForTimeline(decisions: DecisionWithDetails[]): DecisionWithDetails[]`

**Location**: `src/lib/timeline.ts`

- Pure function, no I/O. Does not filter or mutate its input — ordering only (data-model.md).
- Given `decisions = []`, returns `[]`.

## `/decisions` (Server Component, updated)

- Reads `searchParams`, calls `parseDecisionFilters`, then `listDecisions(filters)` and
  `countDecisions()` in parallel.
- If `countDecisions() === 0`: renders phase 1's existing "no decisions yet" empty state.
- Else if `listDecisions(filters)` is empty: renders the FR-008 "no matches for your filters/
  search" message, with a control to clear filters (FR-005).
- Else: renders `DecisionFilterBar` + the existing list markup, unchanged.

## `/decisions/timeline` (Server Component, new)

- Same `searchParams` parsing and `countDecisions()`/empty-state logic as `/decisions`.
- Passes `listDecisions(filters)`'s result through `sortDecisionsForTimeline` before rendering.
- Renders `DecisionFilterBar` (same component, same props/behavior) + the timeline view, showing
  each entry's status and, once Resolved, its verdict (FR-010), using the existing phase 1
  text-plus-color badge styles.

## `DecisionFilterBar` (Client Component)

**Location**: `src/components/decisions/decision-filter-bar.tsx`

- Reads current filter values via `useSearchParams()`.
- On any control change, builds the new query string and calls
  `router.replace(\`${pathname}?${params}\`)` — `pathname` from `usePathname()`, so the same
  component works unmodified on both `/decisions` and `/decisions/timeline`.
- Includes a "Clear filters" control that navigates to the bare `pathname` (FR-005).
