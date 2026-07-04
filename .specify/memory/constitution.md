<!--
Sync Impact Report
==================
Version change: 1.1.0 → 1.2.0
Modified principles:
  - VII. Performance & Quality Bar (Lighthouse): threshold raised from 90+ to 95+ across all four categories
Added sections: none (Core Principles unchanged in count/structure)
Modified sections:
  - Technology Constraints: hosting/deployment target now fixed (Vercel), no longer listed as deferred;
    added explicit Google + GitHub SSO requirement (specific auth provider/library still deferred to
    the authentication feature's /speckit-plan)
Removed sections: none
Templates requiring updates:
  - .specify/templates/plan-template.md   ✅ no changes needed (Constitution Check gate is generic, derives from this file at plan time)
  - .specify/templates/spec-template.md   ✅ no changes needed (no hardcoded principle references)
  - .specify/templates/tasks-template.md  ✅ no changes needed (no hardcoded principle references)
  - .claude/skills/speckit-*/SKILL.md     ✅ no changes needed (framework-provided, no embedded project principle text)
  - README.md / docs/quickstart.md        n/a (do not exist yet)
Follow-up TODOs: none
-->

# Decision Journal Constitution

## Core Principles

### I. Type Safety & Simplicity

All application code MUST be written in TypeScript with strict mode enabled;
`any` is prohibited except at documented third-party integration boundaries,
where the exception and its reason MUST be commented inline. Solutions MUST
favor the simplest design that satisfies the current spec — speculative
abstractions, unused configuration options, and functionality not required
by an approved spec or task are prohibited.

**Rationale**: This is a scoped personal/portfolio project, not an enterprise
platform. Complexity that isn't earning its keep works directly against the
"I would use this" quality that makes the product compelling, and against
the goal of shipping it as a clean, readable showcase.

### II. Extensive Test Coverage (NON-NEGOTIABLE)

All business logic — including the calibration/scoring engine, category
aggregation, and the decision resolution flow (recording a Right/Wrong/Mixed
verdict and satisfaction score, and locking in a decision's outcome) — MUST
have unit test coverage before being considered done. Every user-facing flow
(decision creation, revisit/resolution, dashboard queries, authentication)
MUST have integration tests exercising it end-to-end at the API/component
level. Playwright (or equivalent) browser-level end-to-end tests are
RECOMMENDED wherever feasible but are OPTIONAL, not a blocking requirement.
Purely presentational components containing no conditional logic MAY be
exempted from unit tests.

**Rationale**: The product's entire value proposition rests on the
calibration numbers being trustworthy, and it's being built incrementally
across five phases where regressions in earlier phases are easy to miss.
Extensive unit and integration coverage catches those regressions early;
full browser-level e2e tests add real confidence but are the slowest and
most expensive to maintain, so they're encouraged rather than mandated.

### III. Privacy & Data Ownership (NON-NEGOTIABLE)

Every decision record MUST be scoped to exactly one authenticated account.
No view, query, route handler, or API endpoint may return, list, or expose
another account's decisions under any circumstance. Unauthenticated users
MUST NOT be able to read or write decision data.

**Rationale**: Decisions logged here may cover health, relationship, and
financial topics — this is sensitive personal data, even though the product
has no multi-tenant sharing model to design around. Data isolation is a
correctness requirement, not a feature.

### IV. WCAG 2.1 AA Accessibility (NON-NEGOTIABLE)

All interactive views (entry forms, dashboard, charts) MUST conform to
WCAG 2.1 Level AA — the standard underlying ADA digital-accessibility
compliance. This includes: full keyboard operability, semantic HTML and
ARIA labeling where needed, visible focus indicators, sufficient color
contrast, and screen-reader-friendly labeling of forms, charts, and
dashboard data. Layouts MUST remain usable down to common mobile viewport
widths.

**Rationale**: This project is meant to be demonstrated to others as a
portfolio piece, and accessibility compliance is treated as a correctness
requirement rather than polish. WCAG 2.1 AA is also independently checkable
via automated tooling (axe, Lighthouse's accessibility audit) plus manual
keyboard/screen-reader passes, so compliance can be verified per feature
rather than asserted.

### V. Transparent AI Assistance

Any AI-generated content — per-decision summaries now, cross-decision
pattern insights later — MUST be visibly labeled as AI-generated in the UI.
AI-generated text MUST be grounded only in the user's own logged data; the
system MUST NOT present fabricated facts, patterns, or statistics that
cannot be derived from the user's actual entries.

**Rationale**: A calibration tool that quietly hallucinates false patterns
about someone's own decisions would undermine the entire premise of the
app — trust in the numbers is the product.

### VI. Clean, Elegant Design

The UI MUST follow a single consistent design system — a consistent spacing
scale, type scale, and color palette — rather than ad hoc per-page styling.
Screens MUST avoid unnecessary visual clutter: every element on a dashboard
or form MUST justify its presence toward the user's current task. When a
design decision is ambiguous, the simpler and more restrained visual option
MUST be preferred over a more elaborate one.

**Rationale**: Simplicity is already a code-level value (Principle I); the
same restraint MUST apply visually. A cluttered dashboard would undercut the
"nice dashboard UI" quality that is part of this project's original appeal,
and inconsistent styling reads as unfinished in a portfolio piece.

### VII. Performance & Quality Bar (Lighthouse)

Every shipped page MUST target a Lighthouse score of 95 or higher in each
of the Performance, Accessibility, Best Practices, and SEO categories,
measured against a production build. A phase's implementation MUST NOT be
marked done while any category scores below 95 without an explicit,
documented justification recorded in that feature's plan.

**Rationale**: "As high as possible" isn't independently checkable, so this
constitution adopts a concrete 95+ bar — above the conventional 90 "green"
threshold — reflecting the priority placed on polish for a project meant to
be demonstrated to others, while still leaving a documented-exception path
for the rare case where the last few points aren't worth the effort.

## Technology Constraints

The application stack is fixed as Next.js (App Router), React, TypeScript,
and Tailwind CSS, matching what is already scaffolded in this repository;
this is not open for reconsideration on a per-feature basis.

The deployment target is fixed as Vercel. Authentication MUST support both
Google and GitHub as SSO/OAuth sign-in providers.

Infrastructure choices not yet fixed — database engine, ORM, and the
specific authentication provider/library used to implement the Google/GitHub
SSO requirement above — MUST be decided during `/speckit-plan` for the
feature that first needs them (starting with the core decision CRUD
feature), and documented in that feature's plan rather than here. Once an
infrastructure choice is made in a feature plan, it is binding for all
subsequent features unless explicitly revisited via a constitution or plan
amendment.

React Server Components MUST be preferred over Client Components. A
component MUST only be marked as a Client Component (`"use client"`) when
it requires interactivity, browser-only APIs, or client-side state that
cannot reasonably be achieved on the server.

## Development Workflow

Features MUST be delivered in the following order, each one taken through
`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`
before the next phase begins:

1. Core decision CRUD plus the review-date-driven revisit/resolve flow
2. Authentication
3. Dashboard and calibration charts
4. Filtering, search, and timeline polish
5. AI assistance — per-decision summaries first, cross-decision pattern
   insights afterward

A later phase MUST NOT begin implementation before the prior phase's spec
is implemented and reasonably functional, since each phase depends on data
or structures the previous phase establishes. Re-sequencing this order
requires an explicit constitution amendment (see Governance), not an ad hoc
change made mid-implementation.

## Governance

This constitution supersedes ad hoc practice; where this document and
informal preference conflict, this document governs until formally amended.

Amendments require: (1) the change proposed and reasoned about explicitly
rather than applied silently, (2) the version bumped per the versioning
policy below, (3) the Sync Impact Report updated, and (4) dependent
templates (plan/spec/tasks templates) reviewed for consistency as part of
the same change.

**Versioning policy**: MAJOR for backward-incompatible governance or
principle removals/redefinitions; MINOR for new principles, sections, or
materially expanded guidance; PATCH for clarifications and wording fixes.

**Compliance review**: each feature's `/speckit-plan` MUST include a
Constitution Check confirming the plan does not violate any NON-NEGOTIABLE
principle (II, III, or IV) before `/speckit-tasks` is run.

**Version**: 1.2.0 | **Ratified**: 2026-07-04 | **Last Amended**: 2026-07-04
