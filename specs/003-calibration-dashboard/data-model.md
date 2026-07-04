# Phase 1 Data Model: Calibration Dashboard

No new Prisma models or migrations. This feature reads the existing `Decision` and `Resolution`
tables established in phase 1 (`specs/001-decision-log-revisit/data-model.md`) and produces the
following **derived, in-memory-only** shapes — nothing below is persisted.

## ResolvedDecisionForCalibration (query output)

The minimal shape returned by `listResolvedDecisionsForCalibration()` — a narrow projection of
`Decision` + its `Resolution`, scoped to the signed-in owner and `status: "Resolved"` only.

| Field          | Type                                     | Source                              |
|----------------|-------------------------------------------|--------------------------------------|
| `confidence`   | Integer (0-100)                            | `Decision.confidence`                |
| `category`     | Enum: Financial, Career, Relationships, Health, Housing, Other | `Decision.category` |
| `verdict`      | Enum: Right, Wrong, Mixed                  | `Decision.resolution.verdict`        |
| `satisfaction` | Integer (1-5)                              | `Decision.resolution.satisfaction` (fetched but not currently used in any calculation — carried for a future phase, not rendered) |

## CalibrationBucket (aggregation output)

The shape both `byBand` and `byCategory` entries share — one row per confidence band or per
category, only for buckets with at least one contributing decision (FR-006).

| Field         | Type    | Notes                                                                 |
|---------------|---------|------------------------------------------------------------------------|
| `label`       | String  | Band label (e.g. `"0-20"`) or category name (e.g. `"Financial"`)       |
| `accuracyRate`| Number (0-1) | `scoreVerdict` sum ÷ `count`, per FR-005                          |
| `count`       | Integer | Number of resolved decisions contributing to this bucket (FR-007)      |

## CalibrationSummary (top-level aggregation result)

| Field       | Type                    | Notes                                                          |
|-------------|-------------------------|------------------------------------------------------------------|
| `byBand`    | `CalibrationBucket[]`   | Ordered low-to-high confidence; empty array if no resolved decisions (US3) |
| `byCategory`| `CalibrationBucket[]`   | Ordered per `CATEGORIES` (`decision-types.ts`); empty array if no resolved decisions |

An empty `CalibrationSummary` (both arrays empty) is exactly the signal `dashboard/page.tsx` uses
to render the empty state from FR-008/US3 — no separate "has any data" flag is needed.
