# Contract: Dashboard Data & Aggregation Functions

Internal function signatures (not a network API — this is a single Next.js app; "contract" here
means the boundary between data access, pure aggregation, and rendering).

## `listResolvedDecisionsForCalibration()`

**Location**: `src/lib/decisions.ts`

```ts
function listResolvedDecisionsForCalibration(): Promise<ResolvedDecisionForCalibration[]>
```

- Calls `requireCurrentUserId()` internally (same pattern as every other function in this file) —
  callers never pass a user id in.
- Returns only decisions where `status === "Resolved"` and `ownerId` matches the current session
  user (FR-002, FR-009).
- Returns `[]` (not an error) when the user has no resolved decisions (US3).

## `scoreVerdict(verdict: Verdict): number`

**Location**: `src/lib/calibration.ts`

- `"Right"` → `1`, `"Wrong"` → `0`, `"Mixed"` → `0.5` (FR-005, spec Assumptions).
- Pure function, no I/O.

## `bucketConfidence(confidence: number): string`

**Location**: `src/lib/calibration.ts`

- Maps a 0-100 integer to one of the five fixed band labels: `"0-20"`, `"21-40"`, `"41-60"`,
  `"61-80"`, `"81-100"` (spec Assumptions).
- Pure function, no I/O. Throws only if given a value already invalid per phase 1's own
  `confidence` validation (0-100 integer) — that invariant is enforced at creation time
  (`validateCreateDecisionInput`), not re-validated here.

## `aggregateCalibration(decisions: ResolvedDecisionForCalibration[]): CalibrationSummary`

**Location**: `src/lib/calibration.ts`

- Groups `decisions` by `bucketConfidence(confidence)` into `byBand`, and by `category` into
  `byCategory`.
- For each group, computes `accuracyRate` as the mean of `scoreVerdict(verdict)` across that
  group's decisions, and `count` as the group's size.
- Omits any band/category with zero contributing decisions (FR-006) — never emits a zero-count
  entry.
- Given `decisions = []`, returns `{ byBand: [], byCategory: [] }`.
- Pure function, no I/O — fully unit-testable without a database.

## `dashboard/page.tsx` (Server Component)

- Calls `requireCurrentUserId()` directly (defense in depth, same as every other `/decisions/*`
  page — CVE-2025-29927 mitigation carried forward from phase 2), then
  `listResolvedDecisionsForCalibration()`, then `aggregateCalibration()`.
- If the resulting `CalibrationSummary` has both arrays empty, renders the FR-008/US3 empty state
  instead of `calibration-table.tsx`/`calibration-chart.tsx`.
- Otherwise renders `calibration-table.tsx` (accessible source of truth) followed by
  `calibration-chart.tsx` (Recharts visualization of the same data), passing the same
  `CalibrationSummary` to both.
