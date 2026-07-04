# Feature Specification: Calibration Dashboard

**Feature Branch**: `003-calibration-dashboard`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Phase 3 of the constitution's Development Workflow: Dashboard and
calibration charts. Dashboard showing calibration for the signed-in user's own resolved decisions
— was their confidence justified? Aggregate resolved decisions (those with a recorded
Right/Wrong/Mixed verdict and satisfaction score) by confidence level and by category, and show
whether higher-confidence decisions actually turned out right more often than lower-confidence
ones. Out of scope: filtering/search/timeline (phase 4), AI assistance (phase 5), and any
multi-app/design-system work (phase 6) — this phase is scoped purely to Decision Journal's own
dashboard, reachable only by the signed-in owner of the decisions being shown."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See calibration by confidence level (Priority: P1)

A signed-in person who has resolved at least one decision opens the dashboard and sees their
decisions grouped into confidence bands (how sure they said they were, at the time), each showing
how often things actually turned out right.

**Why this priority**: This is the headline feature of the phase and the entire reason a
dashboard exists — without it there is no way to answer "was I overconfident, underconfident, or
well-calibrated?", which is the product's core value proposition.

**Independent Test**: Can be fully tested by resolving several decisions logged at different
confidence levels with a mix of Right/Wrong/Mixed verdicts, then confirming the dashboard shows
each confidence band's accuracy rate and how many decisions back that figure.

**Acceptance Scenarios**:

1. **Given** a signed-in user with several resolved decisions spanning different confidence
   levels, **When** they open the dashboard, **Then** they see each confidence band that has at
   least one resolved decision, along with its accuracy rate and contributing decision count.
2. **Given** a signed-in user whose resolved decisions are concentrated in one confidence band,
   **When** they open the dashboard, **Then** only that band appears — bands with zero resolved
   decisions are not shown.
3. **Given** a signed-in user with resolved decisions carrying a mix of Right, Wrong, and Mixed
   verdicts, **When** the dashboard computes a band's accuracy rate, **Then** Right counts fully,
   Wrong counts as no credit, and Mixed counts as half credit toward that rate.

---

### User Story 2 - See calibration by category (Priority: P2)

A signed-in person sees the same kind of accuracy breakdown, but grouped by the category they
assigned each decision to (Financial, Career, Relationships, Health, Housing, Other), so they can
notice patterns like "I'm overconfident about Career decisions but well-calibrated on Financial
ones."

**Why this priority**: A valuable second lens on the same underlying data, but the dashboard is
already useful from User Story 1 alone; this is a refinement layered on top of it.

**Independent Test**: Can be fully tested by resolving decisions across at least two different
categories and confirming the dashboard shows a separate accuracy rate and count per category that
actually has resolved decisions.

**Acceptance Scenarios**:

1. **Given** a signed-in user with resolved decisions in more than one category, **When** they
   view the dashboard, **Then** each category with at least one resolved decision shows its own
   accuracy rate and contributing decision count.
2. **Given** a signed-in user who has never logged a decision in a particular category, **When**
   they view the dashboard, **Then** that category is not shown.

---

### User Story 3 - Meaningful first-visit experience with little or no data (Priority: P3)

A signed-in person who has no resolved decisions yet, or very few, opens the dashboard and
understands what it will show them once they have more data, instead of seeing something that
looks broken or misleadingly precise.

**Why this priority**: Important for a good first impression and for not misrepresenting
statistically thin data, but the dashboard's core value is already delivered by User Stories 1-2
for anyone with a reasonable resolution history.

**Independent Test**: Can be fully tested by viewing the dashboard as a signed-in user with zero
resolved decisions and confirming a clear explanatory empty state appears instead of charts.

**Acceptance Scenarios**:

1. **Given** a signed-in user with no resolved decisions, **When** they open the dashboard,
   **Then** they see a message explaining that calibration data will appear once they resolve
   decisions, rather than an empty or broken chart.
2. **Given** a signed-in user with exactly one resolved decision in a band or category, **When**
   they view its accuracy rate, **Then** the contributing decision count is shown alongside it so
   a single data point is not presented as a reliable trend.

---

### Edge Cases

- What happens when a confidence band or category has zero resolved decisions? It MUST NOT be
  displayed (no empty/misleading 0% bar).
- What happens when a user has only Pending (unresolved) decisions? They are excluded entirely
  from every calibration figure; the dashboard treats this the same as having no resolved
  decisions (User Story 3).
- What happens when every resolved decision falls into a single confidence band or category? Only
  that one band/category appears; the dashboard does not fabricate placeholders for the rest.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show the calibration dashboard only to the signed-in owner of the
  decisions it displays; a signed-out visitor or a different account MUST NOT be able to view it.
- **FR-002**: System MUST include only decisions with a recorded verdict and satisfaction score
  (i.e., previously resolved) in every calibration figure; decisions awaiting resolution MUST be
  excluded.
- **FR-003**: System MUST group a user's resolved decisions into confidence bands and, for each
  band containing at least one resolved decision, show an accuracy rate and the number of
  decisions contributing to it.
- **FR-004**: System MUST group a user's resolved decisions by category and, for each category
  containing at least one resolved decision, show an accuracy rate and the number of decisions
  contributing to it, using the same accuracy calculation as FR-003.
- **FR-005**: When computing an accuracy rate, System MUST count a Right verdict as full credit, a
  Wrong verdict as no credit, and a Mixed verdict as half credit.
- **FR-006**: System MUST NOT display a confidence band or category that has zero contributing
  resolved decisions.
- **FR-007**: System MUST show the contributing decision count alongside every accuracy rate it
  displays.
- **FR-008**: System MUST show an explanatory empty state, instead of any chart, to a signed-in
  user who has no resolved decisions yet.
- **FR-009**: System MUST compute every calibration figure using only the signed-in user's own
  decisions, never another account's.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in user with at least one resolved decision can see their full calibration
  breakdown (by confidence band and by category) within 2 seconds of opening the dashboard.
- **SC-002**: 100% of accuracy figures shown on the dashboard are displayed together with the
  decision count backing them.
- **SC-003**: 0% of a user's calibration figures are ever computed from another account's
  decisions.
- **SC-004**: A user with zero resolved decisions sees an explanatory empty state, not an empty or
  broken chart, on their first visit.
- **SC-005**: Without needing any further explanation, a user can identify which confidence range
  and which category their decisions have been best- and worst-calibrated in.

## Assumptions

- A Mixed verdict counts as half credit (0.5) toward an accuracy rate; Right counts fully, Wrong
  counts as none. This is the reasonable default for turning a three-way verdict into a single
  accuracy percentage, and can be revisited if it proves misleading in practice.
- Confidence bands are fixed at five 20-point-wide ranges (0-20, 21-40, 41-60, 61-80, 81-100);
  user-customizable bucket sizes are out of scope for this phase.
- The dashboard covers all-time resolved decisions with no date-range filtering; time-based
  filtering is explicitly deferred to phase 4 (Filtering, search, and timeline polish) per the
  constitution's Development Workflow.
- No new data entities are introduced. This feature is a read-only aggregation over the existing
  `Decision` and `Resolution` data established in phase 1
  (`specs/001-decision-log-revisit/data-model.md`).
- Out of scope: filtering/search/timeline (phase 4), AI assistance (phase 5), and any
  multi-app/design-system or navigation work (phase 6) — this phase is scoped purely to Decision
  Journal's own dashboard.
