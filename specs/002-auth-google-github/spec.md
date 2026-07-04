# Feature Specification: Authentication via Google & GitHub SSO

**Feature Branch**: `002-auth-google-github`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Authentication (phase 2 of 5, per the project constitution's Development
Workflow — the dashboard, filtering/search, and AI summaries are later phases and out of scope here).
This phase replaces phase 1's single hardcoded placeholder owner with real per-user accounts, so that
each person's decisions are private to them. Visitors can sign in using either their Google or their
GitHub account. Signing in for the first time automatically creates an account — there is no separate
registration step. If someone later signs in with the other provider and that provider reports the
same, verified email address, they land in the same account with access to the same decisions, rather
than getting a second, empty account. Account linking MUST only happen when the email address is
verified by the provider. Anyone who is not signed in can see a sign-in prompt but cannot view, create,
edit, resolve, or delete any decision — attempting to reach any decision-related page while signed out
redirects to the sign-in prompt. Once signed in, a person can only ever see and act on their own
decisions. Signed-in users can sign out. The placeholder single-owner data from phase 1 is dev/test
fixture data only and is not carried forward. Out of scope: dashboard, filtering/search, timeline, AI
summaries, account settings/profile management beyond sign-in and sign-out."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in with Google or GitHub (Priority: P1)

A visitor who wants to use Decision Journal signs in using their existing Google or GitHub account,
without creating a separate username and password.

**Why this priority**: Nothing else in this phase — or any decision data at all — is reachable
without this. It's the entry point for every other capability.

**Independent Test**: Can be fully tested by choosing "Continue with Google" (or GitHub), completing
the provider's sign-in flow, and confirming an account is created on first use and the person lands
on their own (empty) decisions list.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor on the sign-in prompt, **When** they choose "Continue with
   Google", **Then** they complete Google's sign-in flow and land on their decisions list, with an
   account created if this is their first time.
2. **Given** a signed-out visitor on the sign-in prompt, **When** they choose "Continue with
   GitHub", **Then** they complete GitHub's sign-in flow and land on their decisions list, with an
   account created if this is their first time.
3. **Given** someone already signed in, **When** they visit the sign-in prompt again, **Then** they
   are taken directly to their decisions list rather than being asked to sign in again.

---

### User Story 2 - Decision data is private to the signed-in account (Priority: P1)

Once signed in, a person can only see and act on decisions that belong to their own account.

**Why this priority**: This is the actual security requirement this phase exists to satisfy
(constitution Principle III) — without it, phase 1's single-owner data model keeps exposing every
decision to everyone who visits.

**Independent Test**: Can be fully tested by having two different accounts each log a decision, and
confirming neither account can see, edit, resolve, or delete the other's decision.

**Acceptance Scenarios**:

1. **Given** two signed-in accounts, each with their own logged decisions, **When** one account
   views their decisions list, **Then** only their own decisions appear, never the other account's.
2. **Given** a decision belonging to Account A, **When** Account B attempts to view, edit, resolve,
   or delete that decision directly (e.g. via its link), **Then** the system denies access.
3. **Given** a signed-out visitor, **When** they attempt to reach any decision-related page (list,
   detail, new, edit), **Then** they are redirected to the sign-in prompt instead of seeing any
   decision data.

---

### User Story 3 - Signing in with a second linked provider reaches the same account (Priority: P2)

A person who first signed in with Google, and later signs in with GitHub using the same verified
email address, lands in the same account they already had — not a second, empty one.

**Why this priority**: Valuable and expected behavior, but the product is still fully usable from
Story 1 alone if someone simply always uses the same provider; this is a refinement on top of that.

**Independent Test**: Can be fully tested by signing in with Google, logging a decision, signing
out, then signing in with GitHub using an account that reports the same verified email, and
confirming the previously logged decision is visible.

**Acceptance Scenarios**:

1. **Given** an existing account created via Google sign-in, **When** the same person signs in with
   GitHub and GitHub reports the same, verified email address, **Then** they land in their existing
   account with their existing decisions visible.
2. **Given** an existing account created via Google sign-in, **When** someone signs in with GitHub
   reporting a verified email that does not match, **Then** a new, separate account is created.
3. **Given** an existing account, **When** a sign-in attempt reports a matching email address that
   is not verified by the provider, **Then** the system treats it as a separate account rather than
   linking — an unverified email claim is never trusted.

---

### User Story 4 - Sign out (Priority: P2)

A signed-in person can sign out, ending their session.

**Why this priority**: Expected, standard capability, but the product remains usable for a single
session without it.

**Independent Test**: Can be fully tested by signing in, then choosing sign out, and confirming the
person returns to the signed-out experience and can no longer reach decision pages without signing
in again.

**Acceptance Scenarios**:

1. **Given** a signed-in person, **When** they choose to sign out, **Then** their session ends and
   they see the signed-out sign-in prompt.
2. **Given** a person who has signed out, **When** they attempt to revisit a decision page using a
   back button or saved link, **Then** they are redirected to the sign-in prompt.

---

### Edge Cases

- What happens when someone cancels the Google/GitHub consent screen partway through? The system
  MUST return them to the sign-in prompt without creating a partial account.
- What happens when a provider is temporarily unavailable? The system MUST show an error and allow
  retry, without creating an account in an inconsistent state.
- What happens to phase 1's placeholder single-owner data? It is dev/test fixture data only and is
  not carried forward (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a signed-out visitor to sign in using either Google or GitHub.
- **FR-002**: System MUST automatically create an account the first time a person successfully
  signs in; no separate registration step exists.
- **FR-003**: System MUST link a new sign-in to an existing account when the signing-in provider
  reports the same email address as an existing account AND that email is verified by the provider.
- **FR-004**: System MUST NOT link accounts based on an email address that is not verified by the
  provider; it MUST instead create or use a separate account.
- **FR-005**: System MUST scope every decision to exactly one account, and MUST prevent any account
  from viewing, creating, editing, resolving, or deleting another account's decisions.
- **FR-006**: System MUST redirect signed-out visitors who attempt to reach any decision-related
  page to the sign-in prompt.
- **FR-007**: System MUST allow a signed-in person to sign out, ending their session.
- **FR-008**: System MUST redirect a person who has just signed out away from any decision-related
  page they revisit until they sign in again.
- **FR-009**: System MUST return a signed-out visitor to the sign-in prompt, without creating an
  account, if they cancel or fail to complete the provider's sign-in flow.

### Key Entities

- **Account**: Represents one authenticated person. Attributes: verified email address, display
  name, created timestamp. Owns zero or more Decisions, replacing phase 1's single placeholder
  Owner.
- **Linked Sign-In**: Represents one provider (Google or GitHub) connected to an Account.
  Attributes: provider name, provider-reported account identifier. An Account may have one or two
  Linked Sign-Ins (one per provider); a Linked Sign-In belongs to exactly one Account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can go from the sign-in prompt to their own decisions list in under 30
  seconds.
- **SC-002**: 100% of decision-related pages are inaccessible to signed-out visitors.
- **SC-003**: 0% of accounts can view, edit, resolve, or delete another account's decisions in
  normal use.
- **SC-004**: A person who signs in with a second provider using the same verified email reaches
  their existing decisions 100% of the time; a mismatched or unverified email never does.
- **SC-005**: Signing out and attempting to revisit a decision page redirects to sign-in 100% of the
  time.

## Assumptions

- OAuth sign-in itself doubles as registration; there is no separate sign-up form or password.
- Phase 1's single placeholder Owner and its dev/test data are not migrated; each real account
  starts with zero decisions the first time its owner signs in.
- Session duration/expiry follows standard practice for a web session and is not separately
  specified here.
- Account settings/profile management (e.g., changing display name, disconnecting a linked
  provider, deleting an account) are out of scope for this phase.
- The sign-in prompt is the only public-facing page; the home page's existing content is treated as
  the signed-out experience, and it directs signed-in visitors straight to their decisions list
  instead.
