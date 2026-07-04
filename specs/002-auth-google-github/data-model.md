# Phase 1 Data Model: Authentication via Google & GitHub SSO

## Naming note (important)

Auth.js's Prisma adapter has its own required model names, which collide confusingly with this
spec's vocabulary:

| spec.md term    | Auth.js/Prisma model | Meaning                                          |
|------------------|----------------------|----------------------------------------------------|
| **Account**      | `User`               | One authenticated person (spec.md's "Account")       |
| **Linked Sign-In** | `Account`          | One provider connection (Google or GitHub) for a User |

The rest of this document uses the Prisma model names (`User`, `Account`) since that's what the
schema and code actually use; read "Account" below as Auth.js's linked-provider-connection model,
**not** spec.md's "Account" (a person) — that's `User`.

## User

Replaces phase 1's placeholder `Owner` model. Standard Auth.js adapter shape, plus the existing
`decisions` relation moved over from `Owner`.

| Field           | Type      | Notes                                                          |
|-----------------|-----------|-----------------------------------------------------------------|
| `id`            | UUID (PK) |                                                                    |
| `name`          | String, nullable | display name, from whichever provider first created the account |
| `email`         | String, nullable, unique | the verified email that identifies this person (FR-003) |
| `emailVerified` | DateTime, nullable | set when `email` was confirmed verified by a provider     |
| `image`         | String, nullable | avatar URL from the provider                                  |
| `createdAt`     | DateTime  | default `now()`                                                   |

**Relationships**: has many `Account` (linked sign-ins); has many `Decision` (via `Decision.ownerId`,
renamed relation target from the removed `Owner`).

**Validation rules**: `email` is unique — this is the field the account-linking decision (research.md
§5) keys on. A `User` row is only ever created when a sign-in reports a usable email (verified, per
FR-003/FR-004); Google's `email_verified` is trusted directly, GitHub's requires the `/user/emails`
lookup (research.md §4).

## Account (Auth.js's model — spec.md's "Linked Sign-In")

Standard Auth.js adapter shape. One row per provider connected to a `User`.

| Field               | Type              | Notes                                          |
|---------------------|-------------------|---------------------------------------------------|
| `id`                | UUID (PK)         |                                                      |
| `userId`            | UUID (FK -> User) |                                                      |
| `type`              | String            | `"oauth"` for both providers                         |
| `provider`          | String            | `"google"` or `"github"`                             |
| `providerAccountId` | String            | the id the provider assigns this person               |
| `refresh_token`, `access_token`, `expires_at`, `token_type`, `scope`, `id_token`, `session_state` | various, nullable | standard OAuth token bookkeeping fields Auth.js's adapter expects |

**Relationships**: belongs to exactly one `User`. A `User` may have up to two `Account` rows (one
per provider) — this is the mechanism behind spec.md User Story 3 (two sign-ins, one `User`).

**Validation rules**: `(provider, providerAccountId)` is unique — the same provider identity can't
attach to two different `User`s.

## Session

Standard Auth.js adapter model. **Not actually populated at runtime** given the JWT session
strategy (research.md §2) — Auth.js's `PrismaAdapter` interface expects this model to exist
regardless of session strategy, but no rows are read/written for JWT sessions. Included for schema
completeness/adapter compatibility only.

| Field          | Type              | Notes |
|-----------------|-------------------|-------|
| `id`            | UUID (PK)         |       |
| `sessionToken`  | String, unique    |       |
| `userId`        | UUID (FK -> User) |       |
| `expires`       | DateTime          |       |

## VerificationToken

Standard Auth.js adapter model, used for email/passwordless sign-in flows. **Not used** by this
project (OAuth-only, no email sign-in) — included because the adapter's schema requires it to exist.

| Field         | Type     | Notes |
|----------------|----------|-------|
| `identifier`   | String   |       |
| `token`        | String, unique |  |
| `expires`      | DateTime |       |

## Decision (modified from phase 1)

Only the ownership relation changes; every other field is unchanged from
`specs/001-decision-log-revisit/data-model.md`.

- `ownerId` — **field name unchanged**, but now a foreign key to `User.id` instead of the removed
  `Owner.id`. Every existing query/index that already filters by `ownerId`
  (`src/lib/decisions.ts`, the `@@index([ownerId])`) needs no structural change beyond the relation
  target — only `src/lib/owner.ts#getCurrentOwnerId()`'s *implementation* changes (hardcoded lookup
  → real session lookup, per phase 1's research.md §5, which anticipated exactly this swap).

## Removed

- **`Owner`** — phase 1's placeholder model is dropped entirely; `User` takes over its role as the
  target of `Decision.ownerId`. Its single seeded row and any dev fixture decisions are not migrated
  (spec.md Assumptions).
