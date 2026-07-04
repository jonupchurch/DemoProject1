# Phase 1 Data Model: Core Decision Logging & Revisit/Resolve Flow

## Owner

Placeholder for the account system phase 2 introduces (see research.md §5). Exactly one row exists
in this phase, seeded at setup time.

| Field       | Type      | Notes                          |
|-------------|-----------|---------------------------------|
| `id`        | UUID (PK) |                                  |
| `createdAt` | DateTime  | default `now()`                 |

**Relationships**: has many `Decision`.

## Decision

| Field         | Type                          | Notes                                                             |
|---------------|-------------------------------|---------------------------------------------------------------------|
| `id`          | UUID (PK)                     |                                                                       |
| `ownerId`     | UUID (FK → Owner)             | every query filters by this (see research.md §5)                    |
| `title`       | String                        | required, non-empty                                                  |
| `cost`        | Decimal, nullable              | plain numeric value, single implicit currency (spec Assumptions)    |
| `risks`       | Text, nullable                 |                                                                       |
| `notes`       | Text, nullable                 |                                                                       |
| `confidence`  | Integer                       | required; 0–100 inclusive (FR-013)                                   |
| `category`    | Enum: Financial, Career, Relationships, Health, Housing, Other | required |
| `reviewDate`  | Date                           | required; may be in the past (spec US1 scenario 3)                   |
| `status`      | Enum: Pending, Resolved        | default `Pending` (FR-003)                                           |
| `createdAt`   | DateTime                      | default `now()`                                                      |
| `updatedAt`   | DateTime                      | auto-updated on write                                                |

**Relationships**: belongs to one `Owner`; has one or more `Option` (minimum 1 enforced at the
application layer — Prisma cannot express "at least 1" at the schema level); has zero or one
`Resolution`.

**Validation rules** (enforced in `lib/decisions.ts`, not just the database):
- `confidence` MUST be an integer between 0 and 100 inclusive (FR-013).
- At least one `Option` MUST exist at all times; removing the last remaining option is rejected
  (edge case, spec).
- When `status = Resolved`, all fields above except `updatedAt` become immutable (FR-009). Only the
  associated `Resolution`'s fields remain editable (FR-010).

**State transitions**: `Pending → Resolved` (via the resolve action, FR-007/FR-008). No transition
back to `Pending` exists in this phase (spec Assumptions — resolving is one-way).

## Option

| Field         | Type          | Notes                                              |
|---------------|---------------|------------------------------------------------------|
| `id`          | UUID (PK)     |                                                        |
| `decisionId`  | UUID (FK → Decision) |                                                 |
| `name`        | String        | required, non-empty (the only required field per option) |
| `pros`        | Text, nullable |                                                       |
| `cons`        | Text, nullable |                                                       |
| `sortOrder`   | Integer       | preserves the order options were entered in           |

**Relationships**: belongs to exactly one `Decision`.

**Validation rules**: `name` is required; `pros`/`cons` MAY be blank (edge case, spec). Deleting an
`Option` that is the last remaining one on its `Decision` is rejected.

## Resolution

| Field           | Type                          | Notes                                             |
|-----------------|-------------------------------|------------------------------------------------------|
| `id`            | UUID (PK)                     |                                                        |
| `decisionId`    | UUID (FK → Decision, unique)  | one-to-one; exists only once the decision is resolved |
| `verdict`       | Enum: Right, Wrong, Mixed      | required (FR-007)                                     |
| `satisfaction`  | Integer                        | required; 1–5 inclusive (FR-014)                      |
| `learnings`     | Text, nullable                 |                                                        |
| `resolvedAt`    | DateTime                       | default `now()` at creation                           |
| `updatedAt`     | DateTime                       | auto-updated when the resolution itself is edited (FR-010) |

**Relationships**: belongs to exactly one `Decision` (unique FK — enforces zero-or-one cardinality).

**Validation rules**: `satisfaction` MUST be an integer between 1 and 5 inclusive (FR-014). Can only
be created once per `Decision` (attempting to resolve an already-resolved decision routes to editing
the existing `Resolution` instead — edge case, spec).

## Indexes

- `Decision.ownerId` — every query filters by owner; needed from day one even with a single owner,
  since phase 2 will not add new query patterns here, just start filtering by the real session
  owner instead of the hardcoded one.
- `Decision.reviewDate` — supports "find decisions whose review date has arrived or passed" (FR-006)
  without a full table scan as history grows.
- `Decision.category` — supports the phase-3 dashboard's per-category aggregation without a schema
  change at that point.
