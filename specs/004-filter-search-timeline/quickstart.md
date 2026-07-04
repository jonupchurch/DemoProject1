# Quickstart: Validating Filtering, Search & Timeline

## Prerequisites

- Local dev environment set up per phases 1-3 (Postgres running, `.env` populated, `npm install`,
  `npm run prisma:migrate`).
- Signed in as a real account via `npm run dev`.

## Automated checks

```bash
npx tsc --noEmit
npx vitest run
```

Expect `tests/unit/decision-filters.test.ts`, `tests/unit/timeline.test.ts`, and
`tests/integration/decision-filtering.test.ts` to pass alongside the existing suite.

## Manual / browser validation scenarios

1. **Category filter (US1, scenario 1)**: Log decisions in at least two categories. Filter by one
   category on `/decisions`. Confirm only that category's decisions appear.

2. **Status filter (US1, scenario 2)**: With both Pending and Resolved decisions, filter by
   status. Confirm only matching-status decisions appear.

3. **Verdict filter excludes Pending (US1, scenario 3)**: Filter by a verdict (e.g. Right).
   Confirm only Resolved decisions with that verdict appear, and no Pending decisions appear.

4. **Combined filters (US1, scenario 4)**: Apply a category filter and a status filter together.
   Confirm only decisions matching both appear.

5. **Clear filters (US1, scenario 5)**: With filters active, use the clear control. Confirm the
   full list reappears.

6. **Search across each field (US2, scenarios 1-2)**: Log a decision with distinctive text in its
   title, a different distinctive word in its risks, another in its notes, and (after resolving
   it) another in its learnings. Search for each word individually and confirm the same decision
   is found every time.

7. **Search combined with filters (US2, scenario 3)**: With a category filter active, search for a
   term that only matches a decision outside that category. Confirm no results (both conditions
   must match).

8. **No-matches vs. no-decisions (FR-008)**: Search for a nonsense term with decisions present —
   confirm a "no matches" message distinct from the "no decisions yet" empty state a brand-new
   account sees.

9. **Timeline ordering (US3, scenario 1)**: Log decisions with a mix of past/future review dates
   and resolve some of them. Open `/decisions/timeline` and confirm chronological ordering by
   review date (Pending) or resolution date (Resolved), most-recent-first.

10. **Timeline status/verdict distinguishability (US3, scenario 2)**: Confirm Pending and Resolved
    entries are visually distinguishable, and a Resolved entry's verdict is visible.

11. **Timeline respects active filters (US3, scenario 3)**: Apply a filter, then switch to the
    timeline view via its URL/tab. Confirm the same narrowed set appears there too.

12. **Accessibility**: Run axe against `/decisions` (with filters active) and `/decisions/timeline`
    in both empty-state and populated states — expect 0 violations. Confirm every filter control
    has a programmatic label and is keyboard-operable.

13. **Performance**: Run a Lighthouse audit against a production build (`npm run build && npm run
    start`) of `/decisions` and `/decisions/timeline`. Record scores in `plan.md`'s Constitution
    Check, per Principle VII.
