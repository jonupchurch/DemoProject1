# Phase 1 Data Model: Travel Photo Map

## Pin

| Field       | Type              | Notes                                                        |
|-------------|-------------------|---------------------------------------------------------------|
| `id`        | UUID (PK)         |                                                                 |
| `ownerId`   | UUID (FK → User)  | the authenticated account that created it (FR-002, FR-011)     |
| `latitude`  | Float             | required; -90 to 90 inclusive                                  |
| `longitude` | Float             | required; -180 to 180 inclusive                                |
| `caption`   | Text, nullable    | optional (FR-014)                                               |
| `createdAt` | DateTime          | default `now()`                                                 |
| `updatedAt` | DateTime          | auto-updated on write                                           |

**Relationships**: belongs to one `User` (owner, reusing the existing Decision Journal `User`
model — constitution Shared Backend rule); has one or more `Photo` (minimum 1 enforced at the
application layer, the same pattern `Decision`/`Option` already uses for "at least one option" —
see `specs/001-decision-log-revisit/data-model.md`).

**Validation rules** (enforced in application code, not just the database):
- `latitude`/`longitude` MUST be present and within valid range; both come only from the
  uploader's own map selection, never derived from an uploaded file (FR-004, constitution
  Principle IX).
- A `Pin` MUST always have at least one `Photo`; deleting a `Photo` that would leave zero is
  rejected — deleting the whole `Pin` is the only way to remove its last photo (FR-010).
- Only the account referenced by `ownerId` may update or delete a `Pin` or add/remove its `Photo`s
  (FR-009, FR-011, NON-NEGOTIABLE).

**State transitions**: none — a `Pin` doesn't carry a status enum. It exists (published, publicly
visible) until its owner deletes it; there is no draft/moderation state (research.md, spec
Assumptions).

## Photo

| Field         | Type              | Notes                                                              |
|---------------|-------------------|-----------------------------------------------------------------------|
| `id`          | UUID (PK)         |                                                                         |
| `pinId`       | UUID (FK → Pin)   | `onDelete: Cascade` — deleting a `Pin` removes all its `Photo` rows    |
| `url`         | String            | storage location returned by `PhotoStorage.put()` (research.md §2)     |
| `contentType` | String            | one of `image/jpeg`, `image/png`, `image/webp` (research.md §3)        |
| `sortOrder`   | Integer           | preserves gallery display order (FR-007)                               |
| `createdAt`   | DateTime          | default `now()`                                                        |

**Relationships**: belongs to exactly one `Pin`.

**Validation rules**: `contentType` MUST be one of the three accepted image types; the underlying
file MUST NOT exceed 10 MB (both enforced server-side before the file reaches `PhotoStorage`,
FR-013). Deleting a `Pin`'s only remaining `Photo` is rejected (see `Pin` above) — this check
happens at the `Pin` level, not the `Photo` level, since a lone `Photo` doesn't know how many
siblings it has without querying its parent.

## Required change to the existing `User` model

Add a back-relation so Prisma can traverse both directions, the same way `decisions Decision[]`
already does:

```prisma
model User {
  // ...existing fields unchanged...
  decisions Decision[]
  pins      Pin[]   // NEW
}
```

This is additive only — no existing `User` field, index, or relation changes.

## Indexes

- `Pin.ownerId` — supports an owner finding/managing their own pins (edit/delete controls,
  FR-009/FR-012) without a full table scan, the same rationale as `Decision.ownerId`.
- `Photo.pinId` — supports loading a pin's full gallery in display order; already implied by the
  foreign key, made explicit the same way `Option.decisionId` already is in the existing schema.

No index on `latitude`/`longitude` — the spec explicitly rules out proximity/region search for this
version (spec Assumptions), so no geospatial query pattern exists yet to index for.
