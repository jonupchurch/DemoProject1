# Phase 0 Research: Calibration Dashboard

## 1. Charting library: Recharts vs. alternatives vs. hand-rolled

**Decision**: Use [Recharts](https://recharts.org/) (`^3.9.2`) for the confidence-band and
category bar charts.

**Rationale**: The user was offered a recommended default (hand-rolled SVG/CSS bars, zero new
dependencies) and an alternative (a charting library) via a direct question, and chose the
charting-library route for a more polished, interactive result. Of the mainstream React charting
libraries, Recharts remains "the most practical default for charting libraries in 2026" per
current guidance, is React-idiomatic (declarative `<BarChart>`/`<Bar>` composition rather than
raw D3), and is well-suited to the simple bar-chart shape this feature needs. Generic guidance
found ahead of implementation warned that Recharts' peer-dependency range lags React 19 and would
need a `react-is` override; **verified during implementation (T001) that this is no longer true**
— the currently published `recharts@3.9.2` declares `react-is: ^16.8.0 || ^17.0.0 || ^18.0.0 ||
^19.0.0` and installed cleanly against this project's React 19.2.7 with no override and no new
`npm audit` findings (the existing moderate advisories are pre-existing, in `postcss`/`next`/
`prisma` dev tooling, unrelated to this dependency).

**Alternatives considered**:
- **Hand-rolled SVG/CSS bars** — the recommended simpler default; zero new dependencies, smallest
  bundle impact, full control over accessibility. Not chosen — the user preferred a charting
  library's polish for this dashboard.
- **visx (Airbnb)** — lower-level D3-based primitives; smaller final bundle if tree-shaken well,
  but meaningfully more implementation code for the same result than Recharts' declarative API.
  Rejected as unnecessary complexity for five-to-six-bar charts.
- **Chart.js (via react-chartjs-2)** — canvas-based rather than SVG, which makes pairing it with an
  accessible data table (this feature's chosen a11y mitigation, see §2) more natural than fighting
  SVG accessibility, but canvas output is opaque to browser zoom/print and to any future in-chart
  DOM tooling. Rejected in favor of Recharts' more common React-ecosystem usage and documentation.

## 2. Accessibility approach for Recharts output

**Decision**: Every chart is paired with a visible, semantic HTML `<table>` (`calibration-table.tsx`)
presenting the identical band/category, accuracy percentage, and contributing-decision-count data
that the chart shows. The table is the source of truth for screen-reader/keyboard users; the chart
is a supplementary visualization of the same data, not the sole way to access it.

**Rationale**: Recharts renders to SVG without reliable built-in ARIA semantics for data series,
and retrofitting full screen-reader support onto an SVG bar chart is its own significant (and
fragile) undertaking. Constitution Principle IV is NON-NEGOTIABLE, so rather than depending on the
chart library's accessibility behavior (or building custom ARIA live-region wiring around it), this
feature guarantees compliance structurally: the accessible representation of the data exists
independently of the chart, satisfying Principle IV regardless of what Recharts itself does or
doesn't expose to assistive technology.

**Alternatives considered**:
- **ARIA-annotate the chart directly** (`role="img"`, `aria-label` summarizing the whole chart) —
  simpler to add, but collapses multiple data points into one opaque label; does not give
  screen-reader users the same per-band/per-category detail sighted users get from the bars.
  Rejected as insufficient for NON-NEGOTIABLE Principle IV.
- **Visually-hidden table** (`sr-only`) instead of a visible one — considered, but a visible table
  is simpler to build and test, costs no more effort, and benefits every user (not just
  screen-reader users) by giving exact percentages/counts a bar chart can only approximate visually.

## 3. Data fetching: dedicated query vs. reusing `listDecisions()`

**Decision**: Add a new `listResolvedDecisionsForCalibration()` function in `lib/decisions.ts`,
using a narrow Prisma `select` (only `confidence`, `category`, and the related `resolution`'s
`verdict`/`satisfaction`) filtered to `status: "Resolved"` and the current owner.

**Rationale**: `listDecisions()` fetches every decision (Pending and Resolved) with its full
`options` relation, none of which the calibration aggregation needs. A dedicated, minimally-selected
query is simpler to reason about and test in isolation (it directly encodes FR-002's
resolved-only requirement at the database level, rather than filtering an over-fetched array in
application code) and keeps `lib/decisions.ts`'s existing one-function-per-query-shape convention
intact.

**Alternatives considered**:
- **Filter `listDecisions()`'s result in the dashboard page** — fewer lines of new code, but
  over-fetches `options` data the dashboard never renders, and leaves FR-002's exclusion rule
  implicit in a filter call rather than explicit in the query itself. Rejected in favor of the
  clearer, more efficient dedicated query.

## 4. Confidence-band boundaries and Mixed-verdict scoring

**Decision**: Already fixed in `spec.md`'s Assumptions section (five 20-point-wide bands;
Right = 1, Wrong = 0, Mixed = 0.5) — no further research needed here; this section exists only to
record that these were treated as product decisions belonging in the spec, not open technical
questions for this plan.
