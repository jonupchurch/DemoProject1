# Feature Specification: Filtering, Search & Timeline

**Feature Branch**: `004-filter-search-timeline`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Phase 4 of the constitution's Development Workflow: Filtering,
search, and timeline polish. Let a signed-in user filter their own decisions list by category, by
status (Pending/Resolved), and by verdict (Right/Wrong/Mixed, for resolved decisions), and search
by keyword across a decision's title, risks, notes, and learnings. Add a timeline view presenting
a signed-in user's own decisions in chronological order (by review date and, once resolved, by
resolution date) as a richer visual complement to the existing plain list. Out of scope: AI
assistance (phase 5) and any multi-app/design-system work (phase 6) — this phase is scoped purely
to Decision Journal's own decisions list/search/timeline, reachable only by the signed-in owner of
the decisions being shown."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter the decisions list (Priority: P1)

A signed-in person with a growing list of decisions narrows it down to just the ones they care
about right now — for example, only their unresolved Financial decisions, or only decisions they
got Wrong — instead of scanning the entire history.

**Why this priority**: As the decision list grows over weeks and months, an unfiltered list stops
being useful on its own. Filtering is the most direct way to make a long history usable again, and
delivers value even with no other capability in this phase.

**Independent Test**: Can be fully tested by logging decisions across multiple categories and
statuses, then applying a category filter, a status filter, a verdict filter, and combinations of
them, and confirming only matching decisions appear each time.

**Acceptance Scenarios**:

1. **Given** a signed-in user with decisions in several categories, **When** they filter by one
   category, **Then** only decisions in that category appear.
2. **Given** a signed-in user with both Pending and Resolved decisions, **When** they filter by
   status, **Then** only decisions with that status appear.
3. **Given** a signed-in user with resolved decisions carrying different verdicts, **When** they
   filter by verdict, **Then** only resolved decisions with that verdict appear, and Pending
   decisions are excluded.
4. **Given** a signed-in user with an active category filter, **When** they also apply a status
   filter, **Then** only decisions matching both filters appear.
5. **Given** a signed-in user with active filters, **When** they clear the filters, **Then** the
   full decisions list reappears.

---

### User Story 2 - Search decisions by keyword (Priority: P2)

A signed-in person types a word or phrase they remember from a past decision — its title, a risk
they noted, a comment, or something they learned afterward — and finds it without scrolling
through their whole history.

**Why this priority**: Valuable on its own for recalling a specific past decision, but the list
remains usable via filtering (User Story 1) even before search exists.

**Independent Test**: Can be fully tested by logging a decision with distinctive text in its
title, risks, notes, and learnings, then searching for a keyword unique to each of those fields
and confirming the decision is found each time.

**Acceptance Scenarios**:

1. **Given** a signed-in user's decisions, **When** they search for a word that appears in a
   decision's title, **Then** that decision appears in the results.
2. **Given** a signed-in user's decisions, **When** they search for a word that appears only in a
   decision's risks, notes, or learnings, **Then** that decision still appears in the results.
3. **Given** a signed-in user with an active category or status filter, **When** they also search
   by keyword, **Then** results match both the filter and the search term.
4. **Given** a signed-in user's decisions, **When** they search for a word that appears in no
   decision, **Then** they see a clear "no matches" message rather than an empty, unexplained list.

---

### User Story 3 - View decisions on a timeline (Priority: P3)

A signed-in person looks at their decisions laid out in chronological order — upcoming and past
reviews alongside past resolutions — as a richer, more visual way to see their history than a
plain list.

**Why this priority**: A genuinely nice-to-have presentation layer on top of data that's already
fully usable via the list, filtering, and search; the product doesn't depend on it to be valuable.

**Independent Test**: Can be fully tested by logging decisions with a mix of past and future
review dates and a mix of resolved and pending status, then confirming the timeline presents them
in correct chronological order with Pending/Resolved (and verdict) visually distinguishable.

**Acceptance Scenarios**:

1. **Given** a signed-in user with several decisions at different review dates, **When** they open
   the timeline view, **Then** decisions appear ordered chronologically by review date while
   Pending, and by resolution date once Resolved.
2. **Given** a signed-in user's timeline, **When** they look at a resolved decision's entry,
   **Then** its verdict is visually distinguishable from a still-pending decision's entry.
3. **Given** a signed-in user with active filters or a search term, **When** they view the
   timeline, **Then** it reflects the same narrowed set as the list view would.

---

### Edge Cases

- What happens when a signed-in user has never logged any decision at all? They see the existing
  "no decisions yet" empty state (from phase 1), not a "no matches" message.
- What happens when filters and/or a search term are active but match nothing, even though the
  user does have decisions? They see a distinct "no matches for your current filters/search"
  message, with an easy way to clear them.
- What happens when a search term is empty or only whitespace? It is treated as no search term
  applied at all.
- What happens when a verdict filter is combined with a Pending status filter? This combination
  correctly yields no matches, since Pending decisions have no verdict yet — handled the same as
  any other zero-match case above, not as a special error.
- What happens when two decisions land on the exact same timeline date? They appear in a stable,
  consistent relative order rather than shuffling between views.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a signed-in user filter their own decisions list by one or more
  categories.
- **FR-002**: System MUST let a signed-in user filter their own decisions list by status (Pending
  or Resolved).
- **FR-003**: System MUST let a signed-in user filter their own decisions list by verdict (Right,
  Wrong, or Mixed); this filter applies only to Resolved decisions.
- **FR-004**: System MUST combine multiple active filters so that only decisions matching all of
  them appear (e.g., a category filter and a status filter applied together narrow to their
  intersection).
- **FR-005**: System MUST let a signed-in user clear all active filters and return to their full
  decisions list.
- **FR-006**: System MUST let a signed-in user search their own decisions by keyword, matching
  against a decision's title, risks, notes, and learnings.
- **FR-007**: System MUST apply an active search term together with any active filters, narrowing
  to decisions matching both.
- **FR-008**: System MUST show a message distinguishing "you have no decisions yet" from "nothing
  matches your current filters/search," rather than showing the same empty list in both cases.
- **FR-009**: System MUST provide a timeline view of a signed-in user's own decisions, ordered by
  each decision's review date while Pending, or by its resolution date once Resolved.
- **FR-010**: The timeline view MUST visually distinguish Pending decisions from Resolved ones,
  and MUST show a Resolved decision's verdict.
- **FR-011**: Active filters and search terms MUST apply consistently to both the list view and
  the timeline view.
- **FR-012**: System MUST scope every filtered, searched, or timeline result to the signed-in
  user's own decisions only, under all circumstances — no result may ever include another
  account's decision (constitution Principle III, NON-NEGOTIABLE).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in user can narrow a list of decisions down to a specific category, status,
  or verdict in a few interactions, without needing to scroll through unrelated decisions.
- **SC-002**: A signed-in user can find a specific past decision by typing a few words from its
  title or notes, without scrolling through their entire history.
- **SC-003**: 100% of filtered, searched, or timeline results shown belong exclusively to the
  signed-in user's own account.
- **SC-004**: A user with an empty result always sees a message telling them whether that's
  because they have no decisions yet or because nothing matches their current filters/search.
- **SC-005**: A user can view their full decision history in correct chronological order via the
  timeline, with Pending and Resolved decisions (and each verdict) visually distinguishable at a
  glance.

## Assumptions

- Search matches are case-insensitive substring matches against title, risks, notes, and
  learnings; this is not a fuzzy or relevance-ranked full-text search engine, consistent with the
  scope of a personal tool.
- Category, status, and verdict filters each allow selecting more than one value at a time (e.g.,
  two categories at once), with an OR relationship within a single filter type and an AND
  relationship across different filter types (FR-004).
- No new data entities are introduced. Filtering, search, and the timeline are all read-only query
  variations over the existing `Decision`/`Resolution` data established in phase 1
  (`specs/001-decision-log-revisit/data-model.md`).
- Out of scope: saved filter presets, shareable/bookmarkable filter URLs, relevance-ranked search
  results, exporting timeline data, and any AI assistance (phase 5) or multi-app/design-system
  work (phase 6).
