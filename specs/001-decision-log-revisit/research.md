# Phase 0 Research: Core Decision Logging & Revisit/Resolve Flow

## 1. Database + ORM

**Decision**: PostgreSQL via Vercel Postgres (Neon-backed), accessed through Prisma ORM.

**Rationale**: Confirmed directly with the project owner. Vercel Postgres is the native,
zero-extra-config storage option for a Vercel-deployed app, and the data is genuinely relational
(a decision has many options; later phases aggregate by category and compute calibration across
many decisions) — a real SQL database with `GROUP BY`/aggregate support suits that far better than
a key-value or document store. Prisma is the most widely documented ORM for this stack, which
matters for a portfolio project meant to be legible to others, and its migration tooling
(`prisma migrate`) gives a clean audit trail of schema changes across the five build phases.

**Alternatives considered**:
- **Drizzle ORM** — lighter weight, faster cold starts on serverless. Rejected only because Prisma
  was explicitly preferred for its tutorial ubiquity and mature migration workflow; the cold-start
  cost is mitigated (see §2) rather than avoided architecturally.
- **Supabase** — bundles Postgres with its own auth/storage. Rejected: the constitution already
  fixes Vercel as the deployment target and requires Google/GitHub SSO via a to-be-chosen auth
  library in phase 2, so adding a second platform's auth system would conflict rather than help.
- **Turso (edge SQLite)** — attractive for edge latency, but weaker fit for relational aggregate
  queries the dashboard phase will need, and less mainstream for a Vercel/Next.js portfolio piece.

## 2. Prisma on Vercel serverless: connection handling

**Decision**: Use Vercel Postgres's pooled connection string (`POSTGRES_PRISMA_URL`, PgBouncer-backed)
for the Prisma Client's `datasource url` at runtime, and the non-pooled direct connection string
(`POSTGRES_URL_NON_POOLING`) only for running `prisma migrate` (migrations require a direct
connection; pooled connections don't support Prisma's migration engine).

**Rationale**: This is Vercel's own documented pattern for Prisma specifically because serverless
functions can each open a new connection, and Postgres has a hard connection limit — pooling avoids
exhausting it under normal traffic. This is a solved, standard pattern, not an open research
question.

**Alternatives considered**: Prisma Accelerate (Prisma's own hosted pooling/caching layer) — adds
an external paid service dependency for a benefit Vercel Postgres's built-in pooling already covers
at this project's scale; rejected as unnecessary complexity (Principle I).

## 3. Mutation pattern: Server Actions vs. a REST API layer

**Decision**: All writes (create, edit, delete, resolve, edit-resolution) go through Next.js Server
Actions defined in `src/actions/decisions.ts`. No separate `/api/*` REST route handlers are created
for this phase.

**Rationale**: Nothing outside this Next.js app needs to consume a decision-management API yet (no
mobile app, no third-party integration). Server Actions let forms submit directly to server-side
logic with progressive enhancement and minimal client JavaScript, which directly supports both
Principle I (no unneeded abstraction — skip building a REST layer nothing calls) and Principle VII
(less client JS shipped helps the Lighthouse Performance target).

**Alternatives considered**: Route Handlers (`app/api/decisions/route.ts`) — the conventional choice
if this were consumed by an external client; revisit if a future phase (e.g., a mobile client)
needs one. Documented here so the choice is easy to reopen later without re-litigating it from
scratch.

## 4. Testing strategy

**Decision**: Vitest for both unit and integration tests, with React Testing Library for any
component-level tests. Integration tests run Server Actions against a real local Postgres test
database (a separate database/schema from dev, provisioned locally, not mocked and not SQLite).

**Rationale**: Vitest is the modern default for Vite/Next.js-adjacent TypeScript projects — fast,
native ESM, minimal configuration, and the natural pairing with a strict-TypeScript, simplicity-first
codebase (Principle I). Testing against a real Postgres instance rather than mocking Prisma is
required by Principle II's intent ("extensive... coverage" that actually catches regressions) —
mocking the ORM would let a broken query pass tests while failing in production, which is exactly
the kind of silent bug Principle II exists to prevent.

**Alternatives considered**: Jest — more configuration overhead for ESM/TypeScript in this stack,
no material benefit over Vitest here. Mocking Prisma with `prisma-mock`/manual mocks — faster test
runs, but risks false confidence on real query correctness; rejected for the integration test suite
(unit tests that don't touch the database MAY still use plain function-level testing without a
database).

## 5. Owner scoping ahead of authentication

**Decision**: Add an `Owner` model now (id, createdAt) and an `ownerId` foreign key on `Decision`.
Seed exactly one `Owner` row in local/dev/preview environments and reference its id via a single
`lib/owner.ts` helper (`getCurrentOwnerId()`), used by every Server Action and data-access function.

**Rationale**: This satisfies Principle III's data-isolation intent structurally — every table and
query is already owner-scoped — while acknowledging that the *authentication* gate (verifying who
is logged in) is explicitly phase 2's deliverable per the constitution's Development Workflow.
Phase 2 replaces `getCurrentOwnerId()`'s hardcoded lookup with the authenticated session's user id
and adds the login gate itself; no schema or query changes are needed at that point.

**Alternatives considered**: Skipping owner-scoping entirely until phase 2 — rejected because it
would require retrofitting an `ownerId` column and backfilling it onto existing data later, exactly
the kind of rework the constitution's Technology Constraints section is trying to avoid by deciding
structural choices early.
