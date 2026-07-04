# Implementation Plan: Calibration Dashboard

**Branch**: `003-calibration-dashboard` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-calibration-dashboard/spec.md`

## Summary

Add a read-only dashboard, nested inside the existing Decision Journal app at
`/decisions/dashboard`, that aggregates the signed-in user's own resolved decisions into (a) five
fixed confidence bands and (b) the six existing categories, showing an accuracy rate and
contributing decision count for each. Accuracy is computed with Right = full credit, Wrong = no
credit, Mixed = half credit (spec Assumptions). The aggregation itself is a small set of pure,
unit-tested functions operating on data fetched by a new, minimally-selected Prisma query scoped
to the signed-in owner's resolved decisions only. Bars are rendered with Recharts (the user's
explicit choice over a hand-rolled SVG/CSS alternative), paired with a visible accessible data
table so screen-reader users get the same information the chart conveys.

## Technical Context

**Language/Version**: TypeScript 5.x strict, Next.js 16 (App Router) / React 19 — unchanged from
phases 1-2

**Primary Dependencies**: `recharts` (NEW — user-selected charting library; requires a `react-is`
override in `package.json` to resolve cleanly against React 19, per research.md §1), existing
Prisma/`@prisma/adapter-pg` stack, `next-auth` (session check reused via `requireCurrentUserId()`)

**Storage**: Same Postgres database as phases 1-2. No schema changes — this feature is a read-only
aggregation over the existing `Decision`/`Resolution` tables (spec Assumptions); one new,
narrowly-`select`ed Prisma query is added, no new models or migrations.

**Testing**: Vitest, extending the existing suite. The confidence-bucketing and accuracy-scoring
logic (including the Mixed = 0.5 credit rule) is written as pure functions and gets full unit
coverage, per Principle II — this is exactly the kind of business logic that principle calls out
by name. The new data-fetching function gets an integration test confirming it only returns the
signed-in owner's resolved decisions and excludes Pending ones. The dashboard page and its Recharts
wrapper are otherwise presentational once given pre-aggregated data, consistent with Principle II's
exemption for presentational components with no conditional logic of their own.

**Target Platform**: Vercel serverless (Node runtime) for the dashboard's Server Component/data
fetch; the Recharts chart itself renders in a small Client Component boundary (browser-only
measurement/animation), same pattern as any other interactive leaf in this codebase.

**Project Type**: Web application — same single Next.js project, no new services.

**Performance Goals**: Same Lighthouse 95+ Performance/Accessibility targets (Principle VII).
Recharts is a new client-side dependency, so its actual bundle/performance impact on
`/decisions/dashboard` is measured against a production build during implementation and recorded
here, per the same practice phases 1-2 used for their own measured scores.

**Constraints**:
- **Recharts needs a `react-is` override**: its published peer-dependency range lags React 19;
  without an `overrides` entry in `package.json`, install resolution is unreliable (research.md
  §1). This is a one-time `package.json` change, not an ongoing maintenance burden.
- **Recharts is a Client Component boundary**: `ResponsiveContainer`/`BarChart` need the DOM, so
  the chart itself is rendered from a small `"use client"` component. The aggregation (fetching +
  bucketing + scoring) stays in a Server Component and is passed down as plain data props — the
  chart component never touches Prisma or the session directly, keeping Principle I's
  Server-Component preference intact everywhere except the necessarily-interactive rendering leaf.
- **Recharts' SVG output is not reliably screen-reader accessible on its own** (research.md §2), so
  every chart MUST be paired with a real, visible HTML `<table>` presenting the same band/category,
  accuracy, and count data, satisfying Principle IV without depending on the library's own a11y
  behavior.
- **Dashboard nests inside the Decision Journal app** (`/decisions/dashboard`), not as a new
  top-level flat route — per the constitution's Multi-App Structure rule, top-level flat routes are
  for separate mini-apps; a dashboard is a view *within* Decision Journal, so it belongs under that
  app's own route/nav, not the site-wide showcase nav.

**Scale/Scope**: Single-user-at-a-time personal tool; aggregation runs over, realistically, dozens
to low hundreds of resolved decisions per account — no pagination or streaming concerns at this
scale.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Type Safety & Simplicity** — PASS. The aggregation is a small set of pure functions with no
  speculative generality (fixed five bands, fixed six categories — matching the spec exactly, not a
  configurable N). Recharts is a real dependency addition, but it is the user's explicit,
  consulted-on choice (see Complexity Tracking), not an unrequested abstraction.
- **II. Extensive Test Coverage (NON-NEGOTIABLE)** — PASS (enforced in tasks). Confidence-bucketing
  and accuracy-scoring (Right/Wrong/Mixed → 1/0/0.5) get full unit coverage, including the "band or
  category has zero decisions → omitted" and "zero resolved decisions → empty state" cases. The
  data-fetching query gets an integration test for owner-scoping and Pending-exclusion.
- **III. Privacy & Data Ownership (NON-NEGOTIABLE)** — PASS. The new query reuses
  `requireCurrentUserId()` and filters by `ownerId` exactly like every existing query in
  `lib/decisions.ts`; no cross-account data path exists.
- **IV. WCAG 2.1 AA Accessibility (NON-NEGOTIABLE)** — PASS, with an explicit mitigation: Recharts'
  bars are paired with a visible, semantic `<table>` carrying the same figures, so screen-reader
  users are not dependent on the chart library's own accessibility behavior. Verified with axe
  during implementation, as in prior phases.
- **V. Transparent AI Assistance** — N/A, no AI content in this phase.
- **VI. Clean, Elegant Design** — PASS. Chart colors and spacing reuse the existing Tailwind design
  tokens rather than Recharts' default palette.
- **VII. Performance & Quality Bar (Lighthouse)** — **To be measured** during implementation
  against a production build of `/decisions/dashboard`, exactly like phases 1-2's own documented
  scores; Recharts' bundle weight is the main risk to this gate and will be called out explicitly
  if it requires the documented-justification path.

No unresolved violations against NON-NEGOTIABLE principles. One item is recorded in Complexity
Tracking below (the Recharts dependency), since it is a real addition to the stack, not because it
violates a principle.

## Project Structure

### Documentation (this feature)

```text
specs/003-calibration-dashboard/
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output — derived/computed shapes only (no new Prisma models)
├── quickstart.md              # Phase 1 output
└── contracts/
    └── dashboard-queries.md   # Phase 1 output — data-fetching + aggregation function signatures
```

(`tasks.md` is Phase 2 output — produced by `/speckit-tasks`, not this command.)

### Source Code (repository root)

```text
src/
├── lib/
│   ├── decisions.ts                  # add listResolvedDecisionsForCalibration() — narrowly
│   │                                  # selected Prisma query (confidence, category, resolution.
│   │                                  # verdict/satisfaction only), scoped to requireCurrentUserId()
│   └── calibration.ts                # NEW, pure functions: scoreVerdict() (Right/Wrong/Mixed ->
│                                      # 1/0/0.5), bucketConfidence() (-> one of 5 fixed band
│                                      # labels), aggregateCalibration() (-> { byBand, byCategory },
│                                      # omitting empty buckets per FR-006)
├── app/
│   └── decisions/
│       ├── layout.tsx                # add a small in-app sub-nav: "My Decisions" (/decisions) /
│       │                             # "Dashboard" (/decisions/dashboard) — internal to this app,
│       │                             # distinct from the site-wide showcase nav
│       └── dashboard/
│           └── page.tsx              # NEW, Server Component: requireCurrentUserId (defense in
│                                      # depth, same as every other /decisions/* page) ->
│                                      # listResolvedDecisionsForCalibration -> aggregateCalibration
│                                      # -> empty state (US3) or renders the table + chart
└── components/
    └── dashboard/
        ├── calibration-table.tsx     # NEW, Server Component — accessible <table> of band/category
        │                             # rows (accuracy %, count); the a11y source of truth
        └── calibration-chart.tsx     # NEW, Client Component ("use client") — Recharts BarChart
                                      # rendering the same pre-aggregated data, purely presentational

tests/
├── unit/
│   └── calibration.test.ts           # scoreVerdict, bucketConfidence, aggregateCalibration
│                                      # (incl. empty-bucket omission, zero-resolved-decisions case)
└── integration/
    └── dashboard-data.test.ts        # listResolvedDecisionsForCalibration: owner-scoping,
                                      # Pending-decision exclusion
```

**Structure Decision**: Single Next.js App Router project, unchanged. The dashboard is nested at
`/decisions/dashboard` (not a new top-level route) because it is a view within the Decision
Journal app, not a separate mini-app — consistent with the constitution's Multi-App Structure rule
that top-level flat routes are reserved for separate apps. `lib/decisions.ts` gains one new
function rather than having `listDecisions()` overloaded with an unrelated shape, keeping each
query function single-purpose as the rest of that file already does.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency: `recharts` | User was offered a hand-rolled, zero-dependency bar chart as the recommended simpler default and explicitly chose a charting library instead, for richer/more polished visuals. | The zero-dependency SVG/Tailwind approach was presented and available; not chosen by the person whose call this is. |
