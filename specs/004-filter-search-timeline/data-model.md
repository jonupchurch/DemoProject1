# Phase 1 Data Model: Filtering, Search & Timeline

No new Prisma models or migrations. This feature reads the existing `Decision`, `Option`, and
`Resolution` tables established in phase 1 (`specs/001-decision-log-revisit/data-model.md`) and
adds the following **derived, in-memory-only** shapes — nothing below is persisted.

## DecisionFilters (parsed from URL search params)

| Field        | Type                          | Notes                                                        |
|--------------|-------------------------------|----------------------------------------------------------------|
| `categories` | `Category[]`                  | From repeated/comma-separated `category` params; empty = no filter |
| `statuses`   | `DecisionStatus[]`             | From repeated/comma-separated `status` params; empty = no filter |
| `verdicts`   | `Verdict[]`                    | From repeated/comma-separated `verdict` params; empty = no filter |
| `search`     | `string \| undefined`          | Trimmed; whitespace-only or absent becomes `undefined` (FR-006, edge case) |

Produced by `parseDecisionFilters(searchParams: URLSearchParams): DecisionFilters` — pure, no I/O.

## Extended `listDecisions` query

`listDecisions(filters?: DecisionFilters)` (extends the existing phase 1 function) builds a Prisma
`where` clause:

- `ownerId` — always present (unchanged privacy scoping, FR-012).
- `category: { in: filters.categories }` — only when `categories` is non-empty (FR-001).
- `status: { in: filters.statuses }` — only when `statuses` is non-empty (FR-002).
- `resolution: { verdict: { in: filters.verdicts } }` — only when `verdicts` is non-empty; a
  Pending decision has no `resolution`, so this naturally excludes Pending decisions when active
  (FR-003).
- `OR: [title, risks, notes, resolution.learnings each { contains: filters.search, mode:
  "insensitive" }]` — only when `search` is set (FR-006).

All active conditions are combined with `AND` at the top level (FR-004, FR-007). Existing callers
that pass no `filters` argument are unaffected (backward compatible).

## `countDecisions()` (new)

`countDecisions(): Promise<number>` — `prisma.decision.count({ where: { ownerId } })`, scoped to
the current owner exactly like every other query in `lib/decisions.ts`. Used to distinguish "no
decisions at all" from "no matches for current filters" (FR-008).

## Timeline ordering (derived, not a new entity)

`sortDecisionsForTimeline(decisions: DecisionWithDetails[]): DecisionWithDetails[]` computes, per
decision, a `timelineDate`:

| Decision status | `timelineDate` source        |
|-----------------|-------------------------------|
| Pending         | `reviewDate`                  |
| Resolved        | `resolution.resolvedAt`       |

Decisions are then sorted by `timelineDate` descending (most recent first — spec.md Assumptions),
with a stable tie-break on `createdAt` descending for decisions sharing the same `timelineDate`
(edge case, spec.md). Returns a new array; the underlying `DecisionWithDetails` shape is unchanged
— no new fields are added to the persisted or fetched record.
