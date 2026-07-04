# Quickstart: Validating the Calibration Dashboard

## Prerequisites

- Local dev environment set up per phases 1-2 (Postgres running, `.env` populated, `npm install`,
  `npm run prisma:migrate`).
- Signed in as a real account (Google or GitHub) via `npm run dev` — the dashboard requires a
  session, same as `/decisions`.

## Automated checks

```bash
npx tsc --noEmit
npx vitest run
```

Expect the new `tests/unit/calibration.test.ts` and `tests/integration/dashboard-data.test.ts` to
pass alongside the existing suite.

## Manual / browser validation scenarios

1. **Empty state (US3)**: Sign in as an account with zero resolved decisions. Visit
   `/decisions/dashboard`. Expect the FR-008 empty-state message, not a chart or table.

2. **Single-band population (US1, scenario 2)**: Log and resolve 2-3 decisions all with similar
   confidence values (e.g. all in the 61-80 range) with a mix of Right/Wrong verdicts. Visit
   `/decisions/dashboard`. Expect exactly one band to appear in both the table and the chart, with
   the correct accuracy rate (`sum(scoreVerdict)/count`) and count; no other bands rendered.

3. **Cross-band and cross-category spread (US1, US2)**: Resolve decisions spanning at least two
   confidence bands and two categories, including at least one Mixed verdict. Confirm:
   - Each populated band/category shows in both the table and chart, with the count shown
     alongside its accuracy rate (FR-007).
   - The Mixed-verdict decision contributes exactly 0.5 to its bucket's accuracy sum — verify by
     hand-checking the displayed percentage against the known inputs.
   - No band/category with zero resolved decisions appears anywhere (FR-006).

4. **Pending decisions excluded (FR-002)**: With at least one Pending (unresolved) decision
   present alongside resolved ones, confirm it does not affect any displayed accuracy rate or
   count.

5. **Own-data-only (FR-009)**: Using two different signed-in accounts, each with their own
   resolved decisions, confirm each account's dashboard reflects only their own data.

6. **Accessibility**: Run axe against `/decisions/dashboard` in both the empty-state and populated
   states — expect 0 violations. Confirm the accessible `<table>` (not just the chart) conveys the
   full band/category, accuracy, and count data with a screen reader or by disabling CSS/JS
   rendering of the chart.

7. **Performance**: Run a Lighthouse audit against a production build (`npm run build && npm run
   start`) of `/decisions/dashboard`. Record the Performance and Accessibility scores in `plan.md`'s
   Constitution Check, per Principle VII.
