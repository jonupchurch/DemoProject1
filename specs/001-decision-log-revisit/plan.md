# Implementation Plan: Core Decision Logging & Revisit/Resolve Flow

**Branch**: `001-decision-log-revisit` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-decision-log-revisit/spec.md`

## Summary

Build the foundational Decision Journal loop: users log a decision (title, one-or-more named
options each with their own pros/cons, cost, risks, notes, a 0-100% confidence level, a fixed
category, and a review date), later resolve it (verdict, satisfaction score, learnings), and can
list/view/edit/delete decisions. Technical approach: a single full-stack Next.js (App Router)
application using React Server Components for all reads and Next.js Server Actions for all
mutations, backed by Vercel Postgres via Prisma. No authentication yet — a single hardcoded owner
record stands in for the account system that phase 2 will introduce, with the schema already
shaped around per-owner scoping so that phase 2 slots in without a data model rework.

## Technical Context

**Language/Version**: TypeScript 5.x in strict mode, on Next.js 16 (App Router) / React 19
(already scaffolded in this repository)

**Primary Dependencies**: Next.js, React, Prisma ORM (`@prisma/client`, `prisma`), Tailwind CSS 4

**Storage**: PostgreSQL via Vercel Postgres (Neon-backed) — pooled connection string for
application queries, direct (non-pooled) connection string for migrations

**Testing**: Vitest + React Testing Library for unit and component tests; Vitest integration tests
for Server Actions running against a real local test Postgres database (not mocked, not SQLite —
Postgres-specific behavior must be exercised faithfully). Playwright e2e remains optional per the
constitution and is not included in this phase's tasks.

**Target Platform**: Vercel serverless (Node.js runtime) for Server Actions/Prisma; evergreen
browsers for the UI

**Project Type**: Web application — single full-stack Next.js project (no separate frontend/backend
split; Option 1 "single project" from the planning template, adapted to Next.js App Router
conventions rather than a generic src/models/services layout)

**Performance Goals**: Every page shipped in this phase MUST target Lighthouse Performance ≥95 and
Accessibility ≥95 (constitution Principle VII), achieved primarily by rendering as Server Components
and shipping minimal client-side JavaScript

**Constraints**: Server Components preferred over Client Components (constitution); strict
TypeScript with no `any` outside documented boundaries; database/ORM choice made in this plan
(Vercel Postgres + Prisma) is binding for all later phases unless amended; single implicit
owner/no authentication in this phase

**Scale/Scope**: Single-user personal tool for phase 1 — expect low dozens to low hundreds of
decisions for the one owner; no multi-tenant load or high-concurrency design needed yet

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Type Safety & Simplicity** — PASS. Prisma generates types end-to-end; data access lives in a
  single thin `lib/decisions.ts` module called directly by Server Actions and Server Components —
  no repository/service abstraction layered on top of Prisma, since Prisma's client already is the
  data-access layer at this scale.
- **II. Extensive Test Coverage (NON-NEGOTIABLE)** — PASS (to be enforced in tasks). Unit tests
  cover validation and locking logic (confidence/satisfaction range checks, resolved-entry
  immutability, minimum-one-option rule); integration tests cover every Server Action against a
  real test database.
- **III. Privacy & Data Ownership (NON-NEGOTIABLE)** — PASS, with a documented interim scope note.
  There is no authentication system until phase 2, so "authenticated account" scoping cannot be
  enforced as a login gate yet. To avoid this becoming a real violation, the schema adds an
  `ownerId` column to `Decision` from day one and every query filters by it, using a single
  hardcoded owner record as a stand-in — the isolation *mechanism* exists now, phase 2 only needs
  to swap the hardcoded owner for the authenticated session's user. Additionally: **this phase's
  deployment MUST remain a private/preview Vercel deployment, not a public production URL**, until
  phase 2 ships the actual login gate — otherwise unauthenticated visitors could reach the data,
  which would be a real violation of this principle in practice, not just in code structure.
- **IV. WCAG 2.1 AA Accessibility (NON-NEGOTIABLE)** — PASS (to be enforced in tasks/implementation
  and verified with axe + Lighthouse). All forms use labeled native inputs; the decisions list and
  detail views use semantic HTML landmarks and keyboard-operable controls.
- **V. Transparent AI Assistance** — N/A. No AI-generated content exists in this phase (AI
  summaries are phase 5).
- **VI. Clean, Elegant Design** — PASS. This phase establishes the shared Tailwind design tokens
  (spacing/type/color scale) that every later phase reuses, rather than each phase inventing its
  own styling.
- **VII. Performance & Quality Bar (Lighthouse)** — PASS (to be measured during implementation).
  Server-Components-first rendering keeps client JS minimal; `ownerId`, `reviewDate`, and `category`
  are indexed from the start since later phases (dashboard, filtering) will query on them, avoiding
  a schema migration under load later.

No unresolved violations. Complexity Tracking table is intentionally empty (see below).

## Project Structure

### Documentation (this feature)

```text
specs/001-decision-log-revisit/
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── server-actions.md      # Phase 1 output — Server Action signatures (internal contract)
└── tasks.md                   # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma               # Decision, Option, Resolution, Owner models
└── migrations/                 # Prisma migration history

src/
├── app/
│   ├── layout.tsx               # existing root layout
│   ├── page.tsx                 # existing placeholder home page (updated to link to /decisions)
│   ├── globals.css              # existing, extended with shared design tokens (Principle VI)
│   └── decisions/
│       ├── page.tsx             # decisions list (Server Component)
│       ├── new/
│       │   └── page.tsx         # new decision form (Client Component: dynamic option rows)
│       └── [id]/
│           ├── page.tsx         # decision detail + resolve/edit entry points (Server Component)
│           └── edit/
│               └── page.tsx     # edit a still-pending decision (Client Component)
├── actions/
│   └── decisions.ts             # Server Actions: createDecision, updateDecision, deleteDecision,
│                                 # resolveDecision, updateResolution
├── lib/
│   ├── db.ts                    # Prisma client singleton
│   ├── decisions.ts             # data-access + validation functions used by actions/pages
│   └── owner.ts                 # single hardcoded owner lookup (placeholder for phase-2 auth)
└── components/
    └── decisions/
        ├── decision-form.tsx     # shared create/edit form (options sub-form, pros/cons per option)
        ├── decision-list.tsx     # list item / overdue-review indicator
        └── resolve-form.tsx      # verdict/satisfaction/learnings form

tests/
├── unit/
│   └── decisions.test.ts        # validation + locking logic
└── integration/
    └── decisions-actions.test.ts # Server Actions against a real test Postgres database
```

**Structure Decision**: Single Next.js App Router project (no frontend/backend split). Reads happen
in Server Components calling `lib/decisions.ts` directly; all mutations go through Server Actions in
`src/actions/decisions.ts`, which is the only layer allowed to write to the database. This keeps the
UI/data boundary at the Server Action level instead of introducing a separate REST API that nothing
external needs to consume (Principle I: no unneeded abstraction).

## Complexity Tracking

*No constitution violations require justification. Table intentionally left empty.*
