<!--
Sync Impact Report
==================
Version change: 1.4.0 → 2.0.0
Modified principles:
  - V. Transparent AI Assistance: redefined from an active phase-5 rollout plan (per-decision
    summaries, then cross-decision patterns) to a dormant, standing rule — the project owner
    decided Decision Journal won't get AI assistance after all (not enough value for this app,
    weighed against the cost/complexity of a third-party AI API). The principle is kept in place,
    unrenumbered, only so it still governs *if* AI content is ever added to any mini-app here, and
    so historical Constitution Check sections referencing it by number stay coherent.
Added sections: none
Removed sections: none
Development Workflow: removed the "AI assistance" phase entirely (was #5 — never implemented, no
  specs/ folder exists for it, dropped rather than deferred). "Design & Layout" renumbered from
  #6 to #5; its "(phases 1-5)" dependency note updated to "(phases 1-4)".
Templates requiring updates:
  - .specify/templates/plan-template.md   ✅ no changes needed (Constitution Check gate is generic, derives from this file at plan time)
  - .specify/templates/spec-template.md   ✅ no changes needed (no hardcoded principle references)
  - .specify/templates/tasks-template.md  ✅ no changes needed (no hardcoded principle references)
  - .claude/skills/speckit-*/SKILL.md     ✅ no changes needed (framework-provided, no embedded project principle text)
  - README.md / docs/quickstart.md        n/a (do not exist yet)
Follow-up TODOs: none
-->

# Jon Upchurch Showcase Constitution

## Purpose

This repository hosts a personal portfolio site, not a single-purpose application. Its job is to
showcase a small collection of independent mini-apps, each demonstrating a different skill;
Decision Journal is the first of these built out fully. Additional mini-apps will be added over
time and are deliberately not enumerated here — each one gets its own `/speckit-specify` →
`/speckit-plan` → `/speckit-tasks` → `/speckit-implement` cycle when its turn actually comes.
Every principle, constraint, and workflow rule below governs the site as a whole and every
mini-app hosted on it, not Decision Journal alone, unless a rule says otherwise.

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
across several phases where regressions in earlier phases are easy to miss.
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

Decision Journal itself will not get AI-generated content — the project owner decided this
doesn't add enough value to this particular app to justify the added cost and complexity of
integrating a third-party AI API, so the "AI assistance" phase has been dropped from the
Development Workflow entirely, not deferred. This principle is retained, dormant, as a standing
site-wide rule rather than deleted: **if** AI-generated content is ever added to Decision Journal
or to any other mini-app hosted on this site, it MUST be visibly labeled as AI-generated in the
UI, and MUST be grounded only in that app's own user-logged data — it MUST NOT present fabricated
facts, patterns, or statistics that cannot be derived from the user's actual entries.

**Rationale**: Kept rather than removed so the reasoning behind it survives for any future AI
feature, anywhere on this site, and so historical Constitution Check sections (phases 1-4's
plan.md files, which already reference this principle by number as "N/A") remain coherent instead
of pointing at a renumbered or vanished principle.

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

Every shipped page MUST target a Lighthouse score of 95 or higher in the
Performance and Accessibility categories, measured against a production
build. A phase's implementation MUST NOT be marked done while either
category scores below 95 without an explicit, documented justification
recorded in that feature's plan. Best Practices and SEO scores are not
held to a mandatory threshold.

**Rationale**: "As high as possible" isn't independently checkable, so this
constitution adopts a concrete 95+ bar — above the conventional 90 "green"
threshold — for the two categories that most directly affect real users and
reinforce Principle IV's accessibility requirement. Best Practices and SEO
matter less for a personal tool that isn't optimizing for search
discoverability, so holding them to the same mandatory bar added rigor
without adding value.

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

**Multi-App Structure**: Each mini-app on this site lives at its own flat, top-level route (for
example `/decisions`) and is added to the shared navigation as it ships; there is no `/apps/*`
namespace and no separate hub page required to reach it. The top-level showcase chrome — site
branding plus Home/About/[app] navigation — is shared across the whole site. Mini-apps MAY also
share a common internal "app shell" layout (consistent page chrome/utilities reused across apps)
rather than each inventing bespoke chrome from scratch, but each app's own pages, routes, and
business logic are otherwise independent of every other app's.

## Development Workflow

Features MUST be delivered in the following order, each one taken through
`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`
before the next phase begins:

1. Core decision CRUD plus the review-date-driven revisit/resolve flow
2. Authentication
3. Dashboard and calibration charts
4. Filtering, search, and timeline polish
5. Design & Layout — site-wide design system refinement and multi-app
   scaffolding, carried out once Decision Journal's own feature set
   (phases 1-4) is complete

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

**Version**: 2.0.0 | **Ratified**: 2026-07-04 | **Last Amended**: 2026-07-04
