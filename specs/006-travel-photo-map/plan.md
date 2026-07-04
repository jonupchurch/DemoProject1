# Implementation Plan: Travel Photo Map

**Branch**: `006-travel-photo-map` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-travel-photo-map/spec.md`

## Summary

Second mini-app on the site (constitution Purpose, Development Workflow). Authenticated users pin
a location on an interactive map and publish a gallery of one or more photos there; any visitor,
signed in or not, can browse every published pin's photos and location. Technical approach: reuse
the existing Next.js/Prisma/Auth.js stack entirely (constitution Shared Backend rule) — new `Pin`
and `Photo` tables in the same Postgres database, ownership enforced server-side on every mutating
Server Action (constitution Principle VIII), location recorded only from the uploader's own map
selection with an explicit public-visibility disclosure before publish (constitution Principle IX).
Two new architecturally significant choices were made consultatively with the project owner before
this plan was finalized: MapLibre GL JS for the map (research.md §1), and a `PhotoStorage`
abstraction backed by Vercel Blob in production and the local filesystem in dev/test (research.md
§2).

## Technical Context

**Language/Version**: TypeScript 5.x strict, Next.js 16 (App Router) / React 19 — unchanged from
Decision Journal.

**Primary Dependencies**: Existing (Next.js, React, Prisma, Tailwind, Auth.js) plus two new
additions: `maplibre-gl` (map rendering, wrapped in-house rather than adding a further React-binding
package — research.md §1), and `@vercel/blob` (production photo storage only; the dev/test driver
uses Node's built-in `fs/promises`, no new dependency — research.md §2).

**Storage**: The existing shared Postgres database via the existing Prisma setup, extended with
`Pin` and `Photo` tables and a `User.pins` back-relation (data-model.md) — no new database engine
or ORM (constitution Shared Backend rule). Photo binaries are stored separately from the relational
database via the `PhotoStorage` abstraction (Vercel Blob in production, local filesystem in
dev/test — research.md §2), not as database rows.

**Testing**: Vitest, extending the existing suite. Unit tests cover pure validation (lat/long
range, minimum-one-photo rule, accepted file types/size). Integration tests exercise every Server
Action against the existing real local test Postgres database plus the local-filesystem
`PhotoStorage` driver (never the real Vercel Blob service in tests), including explicit
cross-account ownership-rejection cases (constitution Principle VIII).

**Target Platform**: Vercel serverless — unchanged.

**Project Type**: Web application — same single Next.js project.

**Performance Goals**: Same Lighthouse 95+ Performance/Accessibility bar (constitution Principle
VII), now including that principle's amended image-optimization clauses (`next/image`, responsive
sizing, lazy-loading) for the map's photo markers and each pin's gallery view.

**Constraints**:
- The MapLibre map component MUST be a Client Component, dynamically imported with SSR disabled —
  MapLibre reads `window`/`document` and paints to a canvas at import time and cannot render during
  server-side rendering or static generation (research.md §1).
- The upload pipeline MUST NOT read, parse, or persist EXIF (or any other file-embedded) location
  metadata under any circumstance; a pin's coordinates come only from the map selection submitted
  alongside the file (constitution Principle IX, NON-NEGOTIABLE).
- Every mutating Server Action MUST verify server-side that the current session's user owns the
  target `Pin` before making any change — a control merely absent from the UI for non-owners is not
  sufficient (constitution Principle VIII, NON-NEGOTIABLE; contracts/server-actions.md).
- The `PhotoStorage` driver is selected by environment (production vs. dev/test), mirroring the
  existing Prisma pooled/direct connection-string pattern (`specs/001-decision-log-revisit/research.md`
  §2); once implemented, this choice is binding for any future feature touching photo storage
  unless explicitly revisited via a plan or constitution amendment (Technology Constraints).

**Scale/Scope**: Personal-portfolio scale, same assumption as Decision Journal (specs/
001-decision-log-revisit/plan.md) — expect low tens to low hundreds of pins/photos total; no
high-concurrency or CDN-scale image-serving design is needed beyond what Vercel Blob and
`next/image` already provide.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Type Safety & Simplicity** — PASS. The `PhotoStorage` interface (research.md §2) is the one
  new abstraction this feature introduces; it's justified by a real, explicit requirement (the
  project owner wants dev/test to run without any cloud storage account) and mirrors an existing
  pattern already in this codebase (`src/lib/db.ts`'s Prisma adapter), not a speculative layer.
  Ownership/location logic lives in a thin `lib/travel.ts`, called directly by Server Actions and
  Server Components, matching `lib/decisions.ts`'s existing shape.
- **II. Extensive Test Coverage (NON-NEGOTIABLE)** — PASS (enforced in tasks). Unit tests cover
  coordinate-range validation, the minimum-one-photo rule, and file type/size validation; integration
  tests cover every Server Action (create/edit/delete a pin, add/remove a photo) against a real test
  database and the local-filesystem storage driver, including rejecting another account's attempt to
  mutate a pin it doesn't own.
- **III. Privacy & Data Ownership (NON-NEGOTIABLE)** — N/A as written: this principle's text is
  specifically scoped to Decision Journal's private decision records ("every decision record MUST
  be scoped to exactly one authenticated account... unauthenticated users MUST NOT be able to read
  or write decision data"). This app's pins are public-by-design, not private-by-default, so the
  equivalent correctness requirements are governed by the two new principles below instead.
- **IV. WCAG 2.1 AA Accessibility (NON-NEGOTIABLE)** — PASS (enforced in tasks, verified with axe +
  Lighthouse). This principle's map-specific clause (added this amendment) is satisfied by a plain
  server-rendered, semantic-HTML list view of every pin (research.md §4) rather than attempting to
  retrofit accessibility onto the map widget itself.
- **V. Transparent AI Assistance** — N/A. No AI-generated content anywhere in this feature.
- **VI. Clean, Elegant Design** — PASS. Reuses the site's existing shared design tokens, dark-mode
  support, and motion vocabulary (this amendment) rather than inventing travel-app-specific styling;
  MapLibre's built-in smooth pan/zoom/fly-to motion is tuned to match the durations/easings already
  used by the existing carousel/popover transitions where the two can reasonably align.
- **VII. Performance & Quality Bar (Lighthouse)** — Target: 95+ Performance/Accessibility on a
  production build, to be measured once implemented (same bar and same measurement approach as every
  prior phase). The map's markers and each pin's gallery use `next/image` with responsive sizing and
  lazy-loading below the fold, per this amendment's explicit image-heavy-view clause.
- **VIII. Upload Ownership & Integrity (NON-NEGOTIABLE)** — PASS. Every mutating Server Action
  requires an authenticated session and re-verifies server-side that the caller owns the target
  `Pin` before acting (contracts/server-actions.md) — never inferred from what the UI happens to
  show. Every uploaded file is validated server-side for type and size before being handed to
  `PhotoStorage` (research.md §3).
- **IX. Public Location Data Transparency (NON-NEGOTIABLE)** — PASS. A pin's coordinates are taken
  only from the map click submitted alongside the upload; the upload pipeline has no EXIF-parsing
  step anywhere in it, by construction, not by omission. The publish flow shows the required
  public-visibility disclosure before the pin can be submitted (FR-003), and a published pin
  displays its raw latitude/longitude plus a link to OpenStreetMap's viewer for that coordinate
  (research.md §1) — no precision/fuzzing control, per the principle's own text.

No unresolved violations against any NON-NEGOTIABLE principle (II, III, IV, VIII, IX) — III is N/A
as explained above, not violated. Complexity Tracking below documents the two new dependencies this
feature adds; neither is a principle violation, but both are recorded for the same reason phase 5
recorded `embla-carousel-react` — a new dependency is a real, consultatively-made cost worth a
paper trail even when it doesn't breach a principle.

## Project Structure

### Documentation (this feature)

```text
specs/006-travel-photo-map/
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── server-actions.md      # Phase 1 output — Server Action signatures (internal contract)
└── tasks.md                   # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma               # MODIFIED: adds Pin, Photo models; adds User.pins back-relation

src/
├── app/
│   └── travel/
│       ├── page.tsx             # public map view (Server Component shell; map itself is a
│       │                        # dynamically-imported Client Component island)
│       ├── list/
│       │   └── page.tsx         # public, non-map accessible list view (FR-008)
│       ├── new/
│       │   └── page.tsx         # publish flow — authenticated only (Client Component: map
│       │                        # picker + multi-file upload + caption + disclosure notice)
│       └── [id]/
│           ├── page.tsx         # single pin detail + full gallery (Server Component, public)
│           └── edit/
│               └── page.tsx     # owner-only: edit caption/location, add/remove photos, delete
├── actions/
│   └── travel.ts                # Server Actions: createPin, updatePinDetails, addPhotoToPin,
│                                 # removePhotoFromPin, deletePin
├── lib/
│   ├── travel.ts                 # data-access + validation (listPins, getPin,
│   │                              # isPinOwnedByCurrentUser); mirrors lib/decisions.ts's shape
│   └── photo-storage/
│       ├── index.ts               # PhotoStorage interface + environment-based driver selection
│       ├── local.ts               # dev/test driver: Node fs/promises, gitignored data dir
│       └── vercel-blob.ts         # production driver: @vercel/blob
└── components/
    ├── nav/
    │   └── nav-links.tsx          # MODIFIED: adds a second, independent flyout ("Travel") next
    │                               # to the existing Decisions flyout — Map + List always visible
    │                               # (public, FR-005), "Add a Pin" shown only when signed in
    └── travel/
        ├── travel-map.tsx         # Client Component: MapLibre map, dynamic import (ssr: false)
        ├── pin-marker-popup.tsx   # marker click → photo preview + link to the pin's detail page
        ├── pin-gallery.tsx        # photo gallery display, used on the detail and edit pages
        ├── pin-form.tsx           # shared create/edit form (location picker, multi-file upload,
        │                          # caption, public-visibility disclosure)
        └── pin-list.tsx           # non-map accessible list view's semantic-HTML rendering

tests/
├── unit/
│   └── travel.test.ts            # coordinate-range, minimum-one-photo, file type/size validation
└── integration/
    └── travel-actions.test.ts    # Server Actions against the real test database + local-filesystem
                                    # PhotoStorage driver, incl. cross-account ownership rejection
```

**Structure Decision**: Single Next.js App Router project, unchanged (constitution Technology
Constraints). `/travel` is a flat top-level route, matching how `/decisions` is one — no `/apps/*`
namespace. Reads happen in Server Components calling `lib/travel.ts` directly (public, no auth
check); all mutations go through Server Actions in `src/actions/travel.ts`, the only layer allowed
to write pins/photos or call `PhotoStorage`, mirroring `src/actions/decisions.ts`'s existing role.
`/travel/list` gets its own route (rather than a client-side toggle on `/travel`) to match how
Decision Journal already gives its list/timeline/dashboard each their own route reachable from one
nav flyout (constitution's established multi-app nav pattern, `nav-links.tsx`). This app gets its
own "Travel" flyout the same way — but unlike the Decisions flyout, which is hidden entirely until
signed in, the Travel flyout trigger and its Map/List entries are always visible (FR-005 makes
browsing public); only the flyout's "Add a Pin" entry is conditional on being signed in.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency: `maplibre-gl` | This feature requires a real interactive map; nothing existing in the stack renders one. | Hand-rolling map rendering/tiling from scratch is infeasible at this project's scale; the project owner was offered a simpler raster-tile alternative (Leaflet) and a more feature-rich paid alternative (Mapbox GL) and chose MapLibre directly (research.md §1). |
| New dependency: `@vercel/blob` (production only) | Photo binaries need somewhere to live that isn't the relational database (Principle VII: storing large binaries in Postgres would hurt performance and isn't what a relational database is for). | Storing photos as Postgres `bytea` was explicitly offered to and accepted as acceptable by the project owner for dev/test, but rejected for production to avoid that performance risk becoming the path of least resistance (research.md §2). |
