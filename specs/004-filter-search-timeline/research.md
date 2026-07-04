# Phase 0 Research: Filtering, Search & Timeline

## 1. Where filter/search state lives

**Decision**: URL search params (`?category=Financial&status=Pending&verdict=Right&q=lease`),
parsed by one shared pure function (`parseDecisionFilters`) used by both `/decisions` and
`/decisions/timeline`.

**Rationale**: Next.js App Router Server Components receive `searchParams` as a prop already —
using it as the single source of truth keeps the actual data fetch server-side (Principle I's
Server-Component preference), needs no client-side data cache/state management, and trivially
satisfies FR-011 (filters apply consistently to both views) since both routes call the exact same
parsing function against the exact same kind of input. Only the filter *controls* need
interactivity (Client Component), not the data itself.

**Alternatives considered**:
- **Client-side state + client-side filtering of an already-fetched full list** — would make the
  list/timeline pages Client Components fetching all decisions once and filtering in the browser.
  Avoids server round-trips per filter change, but duplicates query logic in JS, loses the
  Server-Component-by-default posture, and doesn't reduce what's sent over the wire (the point of
  filtering server-side). Rejected as unnecessary complexity for this app's scale.
- **A dedicated API route returning JSON, fetched client-side** — adds a second data-access path
  parallel to the existing Server Component pattern, for no benefit at this scale. Rejected.

## 2. Timeline ordering: application code vs. SQL

**Decision**: Fetch the filtered decisions with the existing query shape (including `resolution`),
then sort them in a small pure function (`sortDecisionsForTimeline`) using each decision's
`reviewDate` while Pending or `resolution.resolvedAt` once Resolved, most-recent-first, with a
stable tie-break on `createdAt` for same-date entries.

**Rationale**: A single decision's relevant "timeline date" comes from one of two different
columns depending on its status — not a plain single-column `ORDER BY`. Prisma can express this via
raw SQL (`CASE WHEN status = 'Resolved' THEN ...`), but at this app's scale (dozens to low hundreds
of decisions per account, same assumption phase 3 made for its aggregation) sorting an already-small
fetched array in JS is simpler, fully unit-testable without a database, and avoids introducing raw
SQL into a codebase that has deliberately avoided it so far.

**Alternatives considered**:
- **Raw SQL `ORDER BY CASE ...`** — pushes the sort into Postgres, which would matter at a much
  larger scale than this personal tool will ever reach. Rejected as unnecessary complexity
  (Principle I).
- **Oldest-first ordering** — equally valid as a default; most-recent-first was chosen as the more
  common convention for a personal journal/activity-style view, and is called out explicitly as an
  assumption (spec.md) rather than something requiring a user decision, since it's easily changed
  later without touching any data or query shape.

## 3. Search implementation

**Decision**: Prisma's `contains` with `mode: "insensitive"` (Postgres `ILIKE`-equivalent) across
`title`, `risks`, `notes`, and `resolution.learnings`, combined with an `OR` at the top level of
the `where` clause.

**Rationale**: Directly satisfies FR-006 with no new infrastructure. Postgres's `ILIKE` is
adequate for a personal tool's data volume; relevance ranking or fuzzy matching (e.g., Postgres
full-text search (`tsvector`), a dedicated search service) would be meaningful over-engineering for
a single user's own decision history, and is explicitly out of scope per spec.md's Assumptions.

**Alternatives considered**:
- **Postgres full-text search (`tsvector`/`tsquery`)** — would require a schema migration (a
  generated/indexed column) for a capability (relevance ranking, stemming) this feature doesn't
  need. Rejected as disproportionate to the actual requirement.

## 4. Distinguishing "no decisions yet" from "no matches" (FR-008)

**Decision**: A small dedicated `countDecisions()` function (`prisma.decision.count({ where: {
ownerId } })`), called alongside the filtered `listDecisions(filters)` fetch. The page shows the
phase 1 empty state when `countDecisions() === 0`, or the FR-008 "no matches" message when the
filtered result is empty but the total count is not.

**Rationale**: Two lightweight queries (a filtered fetch plus a cheap count) are simpler and more
direct than trying to infer "has any decisions at all" from the filtered result alone, and `count`
is a trivial, fast query even before any indexes are considered.

**Alternatives considered**:
- **Infer from an unfiltered `listDecisions()` call** — would over-fetch full decision records
  (with options/resolution) just to check a boolean, when a `count` query says the same thing more
  directly and cheaply. Rejected.
