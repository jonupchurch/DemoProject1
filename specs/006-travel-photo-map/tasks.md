---

description: "Task list for Travel Photo Map"
---

# Tasks: Travel Photo Map

**Input**: Design documents from `/specs/006-travel-photo-map/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md,
quickstart.md

**Tests**: Included and **mandatory** — constitution Principle II (NON-NEGOTIABLE) requires unit
coverage of business logic and integration coverage of user-facing flows, same override as
phases 1-4.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)

## Path Conventions

Single Next.js App Router project per plan.md — `src/`, `tests/` at repository root. Unlike phases
3-4, this feature needs a schema migration and two new dependencies (constitution Shared Backend
rule still applies — same database, same auth — but new tables and new libraries are needed), so
there is a real Setup phase before Foundational. This app also gets its own nav flyout
(`nav-links.tsx`, constitution's established multi-app nav pattern), built up incrementally one
link at a time as each route actually ships — the same way phase 4 added a "Timeline" link to the
Decisions flyout only once `/decisions/timeline` existed.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Add `maplibre-gl` as a dependency (`npm install maplibre-gl`) — research.md §1
- [ ] T002 [P] Add `@vercel/blob` as a dependency (`npm install @vercel/blob`) — production-only
      driver, research.md §2
- [ ] T003 Add `Pin` and `Photo` models plus a `User.pins` back-relation to
      `prisma/schema.prisma` per data-model.md; run `npx prisma migrate dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The storage abstraction, validation, public read functions, and nav entry point
every user story builds on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Implement the `PhotoStorage` interface and its local-filesystem driver in
      `src/lib/photo-storage/index.ts` and `src/lib/photo-storage/local.ts` (research.md §2) —
      writes under a gitignored directory (e.g. `.data/photo-storage/`); add that directory to
      `.gitignore`
- [ ] T005 [P] Implement the production `PhotoStorage` driver in
      `src/lib/photo-storage/vercel-blob.ts`, and environment-based driver selection in
      `src/lib/photo-storage/index.ts` (local driver in dev/test, Vercel Blob in production —
      research.md §2)
- [ ] T006 [P] Implement pure validation functions in `src/lib/travel.ts`: latitude/longitude
      range checks and accepted-file-type/size-limit checks (JPEG/PNG/WebP, 10 MB — research.md
      §3, data-model.md)
- [ ] T007 Implement `listPins()`, `getPin(id)`, and `isPinOwnedByCurrentUser(pin)` in
      `src/lib/travel.ts` per contracts/server-actions.md — the two read functions call no
      `requireCurrentUserId()` (public, FR-005) (depends on T006, same file)
- [ ] T008 Create the route shell `src/app/travel/page.tsx` (public, calls `listPins()`) —
      placeholder content until US2 wires the real map rendering (depends on T007)
- [ ] T009 Add a "Travel" flyout to `src/components/nav/nav-links.tsx`, as a second, independent
      flyout alongside the existing Decisions one (own open/close state, own outside-click/Escape
      handling, same pattern) — with a single "Map" entry (`/travel`) for now. Unlike the Decisions
      flyout, which is hidden entirely until signed in, this flyout's trigger MUST be visible to
      every visitor regardless of `isSignedIn`, per FR-005's public-browsing requirement — only
      individual entries inside it (added in later stories) are conditional

**Checkpoint**: Storage abstraction, validation, public read functions, a route shell, and a
public nav entry point all exist. Nothing to see in the browser yet beyond a placeholder page.

---

## Phase 3: User Story 1 - Publish a pinned photo gallery (Priority: P1) 🎯 MVP

**Goal**: An authenticated user picks a point on the map, uploads one or more photos, sees an
explicit public-visibility notice, and publishes a pin.

**Independent Test**: Sign in, choose a point, upload one or more photos, confirm the notice,
submit, and verify the new pin appears with all of its photos and coordinates (spec.md US1).

### Tests for User Story 1 ⚠️ (write first, confirm they fail before implementation)

- [ ] T010 [P] [US1] Unit tests in `tests/unit/travel.test.ts`: coordinate range boundaries
      (valid/invalid latitude/longitude), accepted vs. rejected file types, and the file size
      limit (FR-004, FR-013)
- [ ] T011 [P] [US1] Integration test `createPin` in `tests/integration/travel-actions.test.ts`:
      an authenticated user successfully creates a pin with one or more photos; an unauthenticated
      caller is rejected (FR-002); invalid coordinates are rejected (FR-004); an empty `photos`
      array is rejected (FR-001, FR-010); an invalid file type or oversized file is rejected with
      no pin persisted (FR-013)

### Implementation for User Story 1

- [ ] T012 [US1] Implement `createPin(input)` Server Action in `src/actions/travel.ts` per
      contracts/server-actions.md — validates via `lib/travel.ts` (T006), uploads each photo via
      `PhotoStorage` (T004/T005), persists the `Pin` and its `Photo` rows (depends on T004, T005,
      T006, T007; T011 must fail first)
- [ ] T013 [P] [US1] Build the `TravelMap` Client Component in
      `src/components/travel/travel-map.tsx`: a dynamically-imported (`next/dynamic`,
      `ssr: false`) MapLibre wrapper supporting a "click to choose a point" mode (research.md §1)
- [ ] T014 [P] [US1] Build the `PinForm` Client Component in
      `src/components/travel/pin-form.tsx` (create mode): embeds `TravelMap` in point-picking
      mode, a multi-file photo input, an optional caption field, and an explicit
      public-visibility disclosure the user must acknowledge before submitting is enabled (FR-003)
- [ ] T015 [P] [US1] Build `PinGallery` in `src/components/travel/pin-gallery.tsx`: renders a
      pin's full photo set using `next/image` with responsive sizing and lazy-loading below the
      fold (FR-007, constitution Principle VII) — needed now, not deferred to US2, so a user has
      somewhere to see the pin they just published
- [ ] T016 [US1] Create `src/app/travel/[id]/page.tsx`: public pin detail page rendering
      `PinGallery`, the pin's raw latitude/longitude, and a link to OpenStreetMap's viewer for
      that coordinate (FR-006, research.md §1) (depends on T015, T007)
- [ ] T017 [US1] Create `src/app/travel/new/page.tsx`: calls `requireCurrentUserId()` (defense in
      depth, matching every other protected page), renders `PinForm` wired to `createPin`, and
      redirects to the new pin's own `/travel/[id]` page on success so publishing has an immediate,
      visible result (depends on T012, T013, T014, T016)
- [ ] T018 [US1] Add `/travel/new` to `src/proxy.ts`'s matcher (edge fast-path redirect,
      CVE-2025-29927 defense-in-depth, same pattern as `/decisions/:path*` and `/contact`)
- [ ] T019 [US1] Add an "Add a Pin" entry (`/travel/new`) to the Travel flyout in
      `src/components/nav/nav-links.tsx` (T009), shown only when `isSignedIn` is true — the flyout
      trigger and its "Map" entry stay visible either way (depends on T009, T017)

**Checkpoint**: An authenticated user can publish a pin — choosing a point on an interactive map
and uploading photos, reachable from the nav — and is immediately taken to see it, gallery and
all. What's still missing is a way to discover *other* pins: nothing yet renders more than one pin
at a time.

---

## Phase 4: User Story 2 - Browse published pins publicly (Priority: P2)

**Goal**: Any visitor, signed in or not, browses a map (and a non-map accessible list) showing
*every* published pin at once — not just one you happen to already have the link to.

**Independent Test**: With one or more pins already published, load the app signed out and
confirm every pin's photos and coordinates are visible via both the map and the list (spec.md
US2).

### Tests for User Story 2 ⚠️ (write first, confirm they fail before implementation)

- [ ] T020 [P] [US2] Integration test in `tests/integration/travel-actions.test.ts`: `listPins()`
      succeeds for an unauthenticated caller and returns every published pin with its photo
      gallery in order (FR-005, FR-007)

### Implementation for User Story 2

- [ ] T021 [US2] Extend `TravelMap` (T013) with a "display markers" mode rendering every pin
      from `listPins()` (depends on T007, T013)
- [ ] T022 [P] [US2] Build `PinMarkerPopup` in `src/components/travel/pin-marker-popup.tsx`:
      marker click shows a cover-photo preview and a link to the pin's `/travel/[id]` page (T016)
- [ ] T023 [US2] Wire `src/app/travel/page.tsx` (T008) to render `TravelMap` in display mode plus
      `PinMarkerPopup`, and a "no pins published yet" empty state when `listPins()` is empty
      (FR-005, spec Edge Cases) (depends on T021, T022)
- [ ] T024 [P] [US2] Build `PinList` in `src/components/travel/pin-list.tsx`: a plain semantic-
      HTML (`<ul>`/`<li>`, real links) list of every pin's coordinates and caption — the non-map
      accessible alternative (FR-008, constitution Principle IV, research.md §4)
- [ ] T025 [US2] Create `src/app/travel/list/page.tsx` calling `listPins()` and rendering
      `PinList` (depends on T024)
- [ ] T026 [US2] Add a "List" entry (`/travel/list`) to the Travel flyout in
      `src/components/nav/nav-links.tsx` (T009), alongside the existing "Map" entry — always
      visible, same as "Map" (depends on T009, T025)

**Checkpoint**: Any visitor, signed in or not, can now discover every pin — not just one they
already had a link to — via both the map and the accessible list, both reachable from the nav.

---

## Phase 5: User Story 3 - Manage your own pins (Priority: P3)

**Goal**: A pin's owner can edit its caption/location, add or remove photos, or delete it
entirely; no other account can do any of this.

**Independent Test**: As a pin's owner, edit its caption/location, add a photo, and remove a
photo; then, as a different account, attempt the same actions and confirm each is rejected
(spec.md US3).

### Tests for User Story 3 ⚠️ (write first, confirm they fail before implementation)

- [ ] T027 [P] [US3] Integration tests in `tests/integration/travel-actions.test.ts` for
      `updatePinDetails`, `addPhotoToPin`, `removePhotoFromPin`, and `deletePin`: the pin's owner
      succeeds at each; a different authenticated account is rejected at each (FR-009, FR-011,
      NON-NEGOTIABLE); removing a pin's only remaining photo is rejected (FR-010); deleting a pin
      removes its photos from the (local-filesystem, in test mode) `PhotoStorage` driver too

### Implementation for User Story 3

- [ ] T028 [US3] Implement `updatePinDetails`, `addPhotoToPin`, `removePhotoFromPin`, and
      `deletePin` Server Actions in `src/actions/travel.ts` per contracts/server-actions.md — each
      verifies `isPinOwnedByCurrentUser` (T007) before making any change (depends on T007, T012;
      T027 must fail first)
- [ ] T029 [US3] Extend `PinGallery`/the pin detail page (T015, T016) to conditionally render
      edit/delete/add-photo/remove-photo controls only when `isPinOwnedByCurrentUser` is true for
      the current viewer (FR-012)
- [ ] T030 [US3] Extend `PinForm` (T014) with an edit mode (pre-filled caption/location, the
      existing gallery with a remove control per photo, an add-photo control, a delete-pin
      control), and create `src/app/travel/[id]/edit/page.tsx` — owner-only, redirecting/rejecting
      otherwise (depends on T014, T028, T029)
- [ ] T031 [US3] Add the pin-edit route pattern to `src/proxy.ts`'s matcher (edge fast-path
      redirect, same CVE-2025-29927 defense-in-depth as T018) — `/travel/new` and
      `/travel/*/edit` require auth; `/travel`, `/travel/list`, and `/travel/[id]` stay public

**Checkpoint**: All three user stories are independently functional — publish, browse, and manage
all work, with ownership enforced everywhere it matters, and every travel page is reachable from
one "Travel" nav flyout.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T032 [P] Run an automated accessibility check (axe) against `/travel`, `/travel/list`,
      `/travel/[id]`, `/travel/new`, and `/travel/[id]/edit`, in signed-in and signed-out states
      and in empty/populated states — including the Travel flyout itself; fix any violations
      (constitution Principle IV)
- [ ] T033 [P] Run Lighthouse against production builds of `/travel`, `/travel/list`, and
      `/travel/[id]`; record Performance/Accessibility scores (constitution Principle VII)
- [ ] T034 [P] Review all new files under `src/lib/photo-storage/`, `src/lib/travel.ts`,
      `src/actions/travel.ts`, and `src/components/travel/` for strict TypeScript compliance with
      no `any` (constitution Principle I)
- [ ] T035 [P] Confirm the map, galleries, forms, and the Travel flyout render correctly in both
      light and dark color schemes using the site's shared design tokens (constitution Principle
      VI)
- [ ] T036 Manually walk through quickstart.md scenarios 1-3 and its non-functional checks
- [ ] T037 Update `specs/006-travel-photo-map/plan.md`'s Constitution Check with the actual
      measured Lighthouse scores from T033, mirroring how phases 1-4 documented theirs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational (`listPins`, T007) and on `TravelMap`
  already existing (T013, US1) to extend with a display mode
- **User Story 3 (Phase 5)**: Depends on Foundational (`isPinOwnedByCurrentUser`, T007), on
  `createPin` existing (T012, US1) since the new actions live in the same file, and on `PinForm`/
  `PinGallery`/the pin detail page already existing (all from US1) to extend with edit controls
- **Polish (Final Phase)**: Depends on all three user stories being complete

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation (constitution Principle II)
- Storage/validation/read primitives before Server Actions, before UI components, before wiring
  pages, before adding that page's nav flyout entry
- Story complete and checkpointed before moving to the next priority

### Parallel Opportunities

- T001–T002 (Setup) touch different files (`package.json` dependency entries) and can run in
  parallel; T003 (schema) is best done after both, though it doesn't strictly conflict
- T004–T006 (Foundational) touch different files and can run in parallel
- T010–T011 (US1 tests) can run in parallel with each other
- T013–T015 (US1 components) touch different files and can run in parallel once T012 exists
- T022 and T024 (US2 components) touch different files and can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch both User Story 1 tests together:
Task: "Unit tests for coordinate/file validation in tests/unit/travel.test.ts"
Task: "Integration test for createPin in tests/integration/travel-actions.test.ts"

# Launch all three User Story 1 components together (once createPin exists):
Task: "Build TravelMap in src/components/travel/travel-map.tsx"
Task: "Build PinForm in src/components/travel/pin-form.tsx"
Task: "Build PinGallery in src/components/travel/pin-gallery.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md scenario 1
5. This is the MVP — a pin can be published, choosing a point on a real interactive map reachable
   from its own nav flyout, and the publisher is taken straight to it, gallery and all; there just
   isn't yet a way to discover *other* pins (that's User Story 2)

### Incremental Delivery

1. Setup + Foundational → storage/validation/read primitives + nav entry point ready
2. User Story 1 → validate publishing → MVP
3. User Story 2 → validate public browsing (map + accessible list)
4. User Story 3 → validate ownership-enforced editing/deleting
5. Final Phase → accessibility/performance pass, quickstart walkthrough, Constitution Check update

---

## Notes

- `[P]` tasks touch different files with no unmet dependencies
- `[Story]` labels map tasks back to spec.md for traceability
- Tests are mandatory here (constitution override of the template default) — write them first,
  confirm failure, then implement
- `createPin` (US1) and `updatePinDetails`/`addPhotoToPin`/`removePhotoFromPin`/`deletePin` (US3)
  all live in the same `src/actions/travel.ts` file, so US3's implementation task is sequential
  with US1's rather than parallel, even though the two stories are otherwise independent
- The Travel flyout (`nav-links.tsx`) is built once (T009) and extended by one entry per story
  (T019, T026) as each route ships, the same incremental pattern phase 4 used for the Decisions
  flyout's "Timeline" entry — never a full flyout with placeholder/dead links
- `/travel`, `/travel/list`, and `/travel/[id]` are deliberately left OUT of `proxy.ts`'s matcher
  — they're public by design (FR-005), unlike every other gated route on this site
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before continuing
