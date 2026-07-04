<!--
Sync Impact Report
==================
Version change: 2.0.0 → 2.1.0
Modified principles:
  - IV. WCAG 2.1 AA Accessibility: expanded — any interactive map view now explicitly requires a
    keyboard-operable, screen-reader-friendly non-map alternative for reaching the same location
    data (an inaccessible map/canvas widget can no longer be the only way in).
  - VI. Clean, Elegant Design: expanded — added site-wide dark mode (shared tokens, not a per-app
    palette) and a shared, consistent motion/transition vocabulary, in support of the showcase's
    "striking and polished" bar for the new travel app.
  - VII. Performance & Quality Bar (Lighthouse): expanded — added explicit image-optimization
    requirements (next/image, responsive sizing, lazy-loading below the fold) for any image-heavy
    view, measured against the same existing 95+ gate rather than a separate threshold.
Added principles:
  - VIII. Upload Ownership & Integrity (NON-NEGOTIABLE) — new. Public-by-design user-uploaded
    content (starting with the travel app's photos/pins) still requires the same server-side
    ownership discipline Principle III already mandates for private data: authenticated-only
    writes, owner-only mutation, server-side validation.
  - IX. Public Location Data Transparency (NON-NEGOTIABLE) — new. Location data is only ever
    supplied by the uploader's own explicit map pin (never scraped from image EXIF metadata), and
    the UI must disclose, before submission, that the pinned coordinates will be publicly visible.
    Per the project owner's explicit direction, this does not include a coordinate-precision/fuzzing
    control — raw lat/long is shown as pinned, alongside a link to an external map site.
Added sections:
  - Technology Constraints: "Shared Backend" paragraph (new mini-apps, starting with travel, MUST
    reuse the existing Postgres database and Auth.js authentication layer rather than introducing
    a parallel stack) and a note that the travel app's file/object storage backend and
    map-rendering library are new, not-yet-fixed infrastructure choices deferred to that app's own
    `/speckit-plan`, mirroring how Decision Journal's DB/ORM/auth-library choices were handled.
  - Development Workflow: clarifying sentence that, once phases 1-5 are complete, each additional
    mini-app (starting with travel) gets its own independent specify→plan→tasks→implement cycle
    with its own phase breakdown, rather than being appended to Decision Journal's numbered list.
Removed sections: none
Governance: Compliance Review's NON-NEGOTIABLE list extended from "(II, III, or IV)" to
  "(II, III, IV, VIII, or IX)".
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
widths. Any interactive map view MUST ship with a keyboard-operable,
screen-reader-friendly alternative for reaching the same location data (for
example, a linked list of pinned places) — a third-party map/canvas widget
that isn't independently accessible MUST NOT be the only way to reach that
data.

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
MUST be preferred over a more elaborate one. The site MUST support both light
and dark color schemes from the same shared design tokens (no separate
one-off palette per mini-app), and interactive state changes (transitions,
popovers, carousel/slide changes) MUST draw from one small, shared set of
motion durations and easings reused across every mini-app rather than ad hoc
per-component timings.

**Rationale**: Simplicity is already a code-level value (Principle I); the
same restraint MUST apply visually. A cluttered dashboard would undercut the
"nice dashboard UI" quality that is part of this project's original appeal,
and inconsistent styling reads as unfinished in a portfolio piece. As the site
grows into a multi-app showcase meant to demonstrate design skill to
employers, restraint and polish are the same goal, not competing ones — a
shared dark mode and a shared motion vocabulary are what let each new
mini-app look "striking" without looking inconsistent with the rest of the
site.

### VII. Performance & Quality Bar (Lighthouse)

Every shipped page MUST target a Lighthouse score of 95 or higher in the
Performance and Accessibility categories, measured against a production
build. A phase's implementation MUST NOT be marked done while either
category scores below 95 without an explicit, documented justification
recorded in that feature's plan. Best Practices and SEO scores are not
held to a mandatory threshold. Any view rendering multiple user-uploaded
images (a photo gallery, a map's photo pins) MUST use Next.js's built-in
image optimization rather than a raw `<img>` tag or a CSS `background-image`,
MUST serve an appropriately sized image per viewport, and MUST lazy-load
images outside the initial viewport — measured against the same 95+ gate
above, not a separate threshold.

**Rationale**: "As high as possible" isn't independently checkable, so this
constitution adopts a concrete 95+ bar — above the conventional 90 "green"
threshold — for the two categories that most directly affect real users and
reinforce Principle IV's accessibility requirement. Best Practices and SEO
matter less for a personal tool that isn't optimizing for search
discoverability, so holding them to the same mandatory bar added rigor
without adding value. Image-heavy views are the likeliest place for that bar
to slip as more mini-apps ship, so the general Lighthouse requirement is
paired here with the specific practices that keep it achievable.

### VIII. Upload Ownership & Integrity (NON-NEGOTIABLE)

Any mini-app that accepts user-uploaded content — photos, map pins, or any
other submission visible to other visitors — MUST restrict creating,
editing, and deleting that content to authenticated accounts. Unauthenticated
visitors MAY view content that is public by design, but MUST NOT be able to
create, modify, or delete it. Every piece of uploaded content MUST be
permanently associated with the authenticated account that created it, and
only that owning account — not any other authenticated account — MAY edit or
delete it. Ownership MUST be enforced server-side on every mutating request;
a control merely hidden or absent from the UI for non-owners is not
sufficient. Uploaded files MUST be validated server-side for type and size
before being accepted or persisted.

**Rationale**: Once content is public by design (unlike Decision Journal's
private-by-default data under Principle III), the risk isn't that the wrong
person can *see* it — that's intended — it's that the wrong person can
*change or delete* it. The same server-side-enforcement discipline Principle
III already requires for private data applies here to a different threat
model, and it earns the same NON-NEGOTIABLE tier because the failure mode
(anyone editing or deleting anyone else's public content) is just as much a
correctness bug as a private-data leak would be.

### IX. Public Location Data Transparency (NON-NEGOTIABLE)

A photo's location data MUST come only from the uploader's own explicit
action — pinning a point on a map at upload time. This repository MUST NOT
read, extract, or persist GPS coordinates from an uploaded image's file
metadata (e.g. EXIF); what gets published is exactly what the uploader
deliberately placed on the map, never a side effect of a file happening to
carry embedded location data the uploader may not know is there. Before an
upload is submitted, the UI MUST make explicit that the pinned coordinates
and photo will be publicly visible to any visitor, signed in or not. A
published location MUST display its latitude/longitude alongside a link to
an external map service (e.g. Google Maps) for that coordinate; this
principle does not require a coordinate-precision or fuzzing control.

**Rationale**: Location data here is public by design, not a leak to guard
against — so the correctness requirement is that publication is a deliberate,
disclosed choice the uploader actively makes (placing a pin, being told it
will be public), not an automatic side effect of uploading a file. Reading
EXIF GPS metadata would risk publishing a location the uploader never chose
to share at all, which is a materially different and worse problem than
showing the coordinates of a pin they placed on purpose. The project owner
explicitly scoped this principle to disclosure and provenance rather than
precision control, to keep the feature's first version simple (Principle I).

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

**Shared Backend**: Every mini-app on this site, including the travel app, MUST persist its data
in the same shared PostgreSQL database (via the same Prisma setup) and MUST authenticate users
through the same Auth.js session/provider configuration already established for Decision Journal.
Introducing a second database engine or a parallel authentication system for a new mini-app is
prohibited without an explicit constitution amendment. Infrastructure choices specific to the
travel app — the file/object storage backend for uploaded photos, and the map-rendering
library/tile provider — are not yet fixed, and MUST be decided during that app's own
`/speckit-plan` and documented there, following the same precedent set by Decision Journal's
database/ORM/auth-library choices in its own phase 1 plan.

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

Once phases 1-5 above are complete, each additional mini-app added to the
site — starting with the travel app — is delivered through its own
independent `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement` cycle, with its own phase breakdown recorded in its own
`specs/<NNN-app-name>/` directory, rather than being appended to the
Decision-Journal-specific numbered list above.

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
principle (II, III, IV, VIII, or IX) before `/speckit-tasks` is run.

**Version**: 2.1.0 | **Ratified**: 2026-07-04 | **Last Amended**: 2026-07-04
