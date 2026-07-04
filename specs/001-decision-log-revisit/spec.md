# Feature Specification: Core Decision Logging & Revisit/Resolve Flow

**Feature Branch**: `001-decision-log-revisit`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Core decision logging and revisit/resolve flow (phase 1 of 5, per the
project constitution's Development Workflow — authentication, the dashboard, filtering/search, and
AI summaries are later phases and out of scope here; assume a single implicit user/owner for now,
with no real login yet). Users record a decision before they make it, capturing: a title/description
of the decision, the options being considered, pros, cons, estimated cost, risks, free-form notes, a
confidence level (0-100%) that this is the right choice, a category chosen from a fixed list
(Financial, Career, Relationships, Health, Housing, Other), and a self-set review date. Decisions
start in a 'pending' state. Once a decision's review date arrives (or has passed), it should be easy
to find and revisit. When the user revisits a pending decision, they resolve it by recording: a
verdict (Right / Wrong / Mixed), a satisfaction score (1-5), and notes on what they learned. Once
resolved, a decision's original entry is locked and no longer editable, but the resolution itself can
be corrected. Users can also view a list of all their decisions, view a single decision's full detail,
edit a still-pending decision's original entry, and delete a decision entirely."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log a decision before making it (Priority: P1)

A person facing an upcoming decision wants to capture their thinking — what they're choosing
between, why, and how confident they feel — before they act, so they can honestly compare their
prediction to the outcome later.

**Why this priority**: Without the ability to log a decision, nothing else in the product can exist.
This is the entry point for every other capability.

**Independent Test**: Can be fully tested by creating a new decision entry with all fields and
confirming it appears in the decisions list with a "pending" status — delivers standalone value as
a structured journal even before any revisit happens.

**Acceptance Scenarios**:

1. **Given** the decisions list, **When** the user starts a new decision entry and provides a title,
   at least one named option (each with its own pros and cons), a confidence level, a category, and
   a review date, **Then** the decision is saved with a "pending" status and appears in the
   decisions list.
2. **Given** a new decision entry in progress, **When** the user omits a required field and attempts
   to save, **Then** the system rejects the save and indicates which field(s) are missing.
3. **Given** a new decision entry, **When** the user sets a review date in the past, **Then** the
   system still accepts and saves the decision (it will simply already be eligible for revisit).

---

### User Story 2 - Resolve a decision and learn from it (Priority: P1)

Once enough time has passed, the person wants to come back to a decision they logged, record what
actually happened, and see how their confidence compared to reality.

**Why this priority**: This is the differentiating capability of the product — without it, this is
just a static note-taking tool with no feedback loop.

**Independent Test**: Can be fully tested by taking an existing pending decision, recording a
verdict, satisfaction score, and learnings, and confirming its status changes to "resolved" with the
original entry now locked — delivers the core "calibration" value on its own.

**Acceptance Scenarios**:

1. **Given** a pending decision, **When** the user resolves it with a verdict (Right, Wrong, or
   Mixed), a satisfaction score, and notes on what they learned, **Then** the decision's status
   changes to "resolved" and its original entry becomes read-only.
2. **Given** a pending decision whose review date has not yet arrived, **When** the user chooses to
   resolve it early, **Then** the system allows the resolution to proceed (the review date is a
   target, not a hard gate).
3. **Given** a resolved decision, **When** the user edits the recorded verdict, satisfaction score,
   or learnings, **Then** the update is saved without affecting the original (locked) entry.
4. **Given** a resolved decision, **When** the user attempts to edit the original entry (options —
   including each option's pros and cons — cost, risks, confidence, category), **Then** the system
   prevents the edit.

---

### User Story 3 - Browse decision history (Priority: P2)

The person wants to see every decision they've logged, in both pending and resolved states, and
open any one of them to see its full detail.

**Why this priority**: Supports reviewing past thinking and is a prerequisite for later phases
(dashboard, filtering), but the product still delivers value from Stories 1-2 alone without a
polished browsing experience.

**Independent Test**: Can be fully tested by logging several decisions in different states and
confirming all of them are visible in a list, each opening to show its full recorded detail.

**Acceptance Scenarios**:

1. **Given** several logged decisions in a mix of pending and resolved states, **When** the user
   views the decisions list, **Then** all decisions are shown regardless of status.
2. **Given** the decisions list, **When** the user selects a single decision, **Then** they see its
   full detail, including resolution information if it has been resolved.

---

### User Story 4 - Edit or delete a decision (Priority: P3)

The person wants to fix a mistake in a decision they haven't resolved yet, or remove a decision
entirely if they no longer want it recorded.

**Why this priority**: A convenience/cleanup capability. The product is fully usable without it,
since decisions can simply be logged correctly the first time.

**Independent Test**: Can be fully tested by editing a pending decision's fields and confirming the
changes persist, and by deleting a decision (pending or resolved) and confirming it no longer
appears anywhere.

**Acceptance Scenarios**:

1. **Given** a pending decision, **When** the user edits its original entry, **Then** the changes
   are saved and reflected immediately.
2. **Given** any decision (pending or resolved), **When** the user chooses to delete it, **Then**
   the system asks for confirmation and, once confirmed, removes the decision permanently.

---

### Edge Cases

- What happens when a user tries to save a decision with a confidence level outside 0-100%? The
  system MUST reject the value and prompt for a valid percentage.
- What happens when a user tries to save a resolution with a satisfaction score outside 1-5? The
  system MUST reject the value and prompt for a valid score.
- What happens when a user attempts to resolve a decision that has already been resolved? The
  system MUST route them to editing the existing resolution rather than creating a second one.
- What happens when the decisions list is empty (no decisions logged yet)? The system MUST show
  guidance directing the user to log their first decision.
- What happens when a user adds an option with no pros or cons filled in? The system MUST allow
  this — an option's pros and cons are optional; only its name/label is required.
- What happens when a user tries to remove the last remaining option from a decision? The system
  MUST block this, since every decision requires at least one option.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the user to create a new decision with: a title, one or more named
  options being considered — each with its own pros and cons — an estimated cost, risks, free-form
  notes, a confidence level (0-100%), a category selected from a fixed list (Financial, Career,
  Relationships, Health, Housing, Other), and a review date.
- **FR-002**: System MUST require a title, at least one option (with a name/label), a confidence
  level, a category, and a review date before a decision can be saved; an option's pros and cons,
  cost, risks, and notes MAY be left blank.
- **FR-003**: System MUST set a newly created decision's status to "pending".
- **FR-004**: System MUST allow the user to view a list of all decisions regardless of status.
- **FR-005**: System MUST allow the user to view the full detail of any single decision.
- **FR-006**: System MUST make it possible to identify, from the decisions list, which pending
  decisions have a review date that has arrived or passed.
- **FR-007**: System MUST allow the user to resolve any pending decision by recording a verdict
  (Right, Wrong, or Mixed), a satisfaction score (1-5), and notes on what they learned, regardless
  of whether its review date has arrived.
- **FR-008**: System MUST change a decision's status to "resolved" once it has been resolved.
- **FR-009**: System MUST prevent edits to a resolved decision's original entry (options —
  including each option's pros and cons — cost, risks, notes, confidence level, category).
- **FR-010**: System MUST allow the user to edit the resolution (verdict, satisfaction score,
  learnings) of an already-resolved decision.
- **FR-011**: System MUST allow the user to edit the original entry of a decision that is still
  pending.
- **FR-012**: System MUST allow the user to delete any decision, regardless of status, after
  explicit confirmation.
- **FR-013**: System MUST reject a confidence level outside the 0-100% range.
- **FR-014**: System MUST reject a satisfaction score outside the 1-5 range.
- **FR-015**: System MUST persist all decision and resolution data so it remains available across
  sessions.
- **FR-016**: System MUST allow the user to add and remove options on a decision while it is still
  pending, provided at least one option always remains.

### Key Entities

- **Decision**: Represents a single logged decision. Attributes: title, estimated cost, risks,
  notes, confidence level (0-100%), category (one of a fixed set), review date, status (pending or
  resolved), created timestamp. Has one or more Options.
- **Option**: A single choice being considered as part of a decision. Attributes: name/label, pros,
  cons. Belongs to exactly one Decision; a Decision has one or more Options (a single-option
  Decision is valid, e.g. a yes/no choice).
- **Resolution**: The outcome information attached to a decision once resolved. Attributes: verdict
  (Right, Wrong, or Mixed), satisfaction score (1-5), learnings/notes, resolved timestamp. Exists
  only once a Decision has been resolved, and belongs to exactly one Decision.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can log a complete new decision in under 3 minutes.
- **SC-002**: A user can locate and open any specific past decision from the decisions list in
  under 10 seconds.
- **SC-003**: 100% of resolved decisions retain their original entry unchanged after resolution (no
  data drift between what was decided and what is later reviewed).
- **SC-004**: A user can resolve a pending decision (recording verdict, satisfaction, and learnings)
  in under 2 minutes.
- **SC-005**: Zero decisions are lost or corrupted across a normal session of creating, resolving,
  editing, and deleting entries.

## Assumptions

- Each option carries its own pros and cons, rather than pros/cons being flat fields on the decision
  as a whole — this matches how people naturally compare choices and sets up a richer comparison
  view in later phases. A decision with only one option (e.g., a yes/no choice like "take this job
  offer") is valid; it isn't required to have two or more.
- The review date is a self-set target for when to revisit a decision, not an enforced gate — users
  may resolve a decision earlier or later than its review date.
- Resolving a decision does not allow later reverting it back to "pending"; only the resolution
  fields themselves (verdict, satisfaction score, learnings) can be corrected afterward.
- Deletion is permanent (hard delete) and requires user confirmation; no trash/recovery mechanism
  is included in this phase.
- Cost is recorded as a plain numeric value in a single, implicit currency; no multi-currency
  support is needed.
- This phase assumes a single implicit user/owner with no authentication — all decisions belong to
  that one owner. Multi-user data isolation is introduced in phase 2 per the project constitution's
  Development Workflow.
- No automated reminder/notification is sent when a review date arrives — the decisions list
  surfaces overdue/upcoming reviews passively, per the earlier product decision to avoid building
  notification infrastructure in this phase.
