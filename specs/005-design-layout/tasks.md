---

description: "Task list for Design & Layout (written retroactively — see plan.md)"
---

# Tasks: Design & Layout

**Input**: Design documents from `/specs/005-design-layout/`

**Prerequisites**: plan.md, spec.md, research.md

**Tests**: Included and **mandatory** — constitution Principle II (NON-NEGOTIABLE), same override
as phases 1-4.

**Note**: Written retroactively. Every task below was already implemented, verified, and confirmed
working (tests, axe, Lighthouse) before this file was created — see plan.md's header note. Tasks
are recorded here, all checked off, so this phase has the same documentation trail as phases 1-4,
and so any future extension (a real second mini-app, a redesigned Contact page) has an accurate
record of what already exists to build on.

**Organization**: Tasks are grouped by user story (from spec.md).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] Add `embla-carousel-react` dependency (`npm install embla-carousel-react`) — see
      research.md §2 for the hand-rolled-vs-library decision
- [X] T002 `src/components/nav/nav-bar.tsx` resolves `isSignedIn` from the session and passes it
      to `NavLinks`, replacing the previous session-unaware nav

**Checkpoint**: Nav can now distinguish signed-in from signed-out state; carousel dependency is
available.

---

## Phase 2: User Story 1 - Signed-out visitor sees only the public surface (P1)

### Tests for User Story 1

- [X] T003 [P] [US1] Unit tests in `tests/unit/nav-links.test.tsx`: Decisions/Contact hidden when
      `isSignedIn={false}`, shown when `isSignedIn={true}`
- [X] T004 [P] [US1] Unit tests in `tests/unit/sign-in-menu.test.tsx`: popover open/close
      (click/Escape/outside-click), calls `signIn` with the right provider
- [X] T005 [P] [US1] Unit tests in `tests/unit/sign-in-buttons.test.tsx`: `callbackUrl` follows
      `usePathname()` rather than a fixed route

### Implementation for User Story 1

- [X] T006 [US1] Hide the Decisions flyout trigger and the Contact link entirely in
      `src/components/nav/nav-links.tsx` when `isSignedIn` is false (depends on T002)
- [X] T007 [US1] Create `src/app/contact/page.tsx` — gated placeholder calling
      `requireCurrentUserId()` directly, matching every other protected page's pattern
- [X] T008 [US1] Extend `src/proxy.ts`'s matcher to include `/contact` alongside
      `/decisions/:path*` (edge fast-path redirect, defense-in-depth per CVE-2025-29927)
- [X] T009 [P] [US1] Build `src/components/auth/sign-in-menu.tsx` — popover mirroring
      `user-menu.tsx`'s open/close pattern, housing `SignInButtons`
- [X] T010 [US1] Update `src/components/auth/sign-in-buttons.tsx`: `callbackUrl` uses
      `usePathname()` instead of a hardcoded `"/decisions"`; GitHub button given a solid white
      background (previously relied on inherited text color, unreadable on a dark hero background)
- [X] T011 [US1] Style the nav's "Sign in" trigger as a button in
      `src/components/nav/nav-bar.tsx`, replacing `SignInMenu` for the plain underlined link

**Checkpoint**: A signed-out visitor sees only Home/About, can sign in from any page via a
popover, and lands back where they were afterward.

---

## Phase 3: User Story 2 - Signed-in user reaches a mini-app via a nav flyout (P1)

### Tests for User Story 2

- [X] T012 [P] [US2] Unit tests in `tests/unit/nav-links.test.tsx`: flyout opens on click, closes
      on second click/Escape/outside-click, correct `aria-current` on the active sub-link

### Implementation for User Story 2

- [X] T013 [US2] Convert the "Decisions" entry in `src/components/nav/nav-links.tsx` from a plain
      link into a click-to-open flyout listing My Decisions/Timeline/Dashboard
- [X] T014 [US2] Delete `src/components/decisions/decisions-subnav.tsx` (superseded by the flyout)
      and simplify `src/app/decisions/layout.tsx` accordingly

**Checkpoint**: Decision Journal's sub-pages are reachable from a single nav control; no
per-page subnav bar remains.

---

## Phase 4: User Story 3 - Home page showcases every mini-app via a carousel (P2)

### Tests for User Story 3

- [X] T015 [P] [US3] Unit tests in `tests/unit/app-showcase-carousel.test.tsx` (mocking
      `embla-carousel-react`'s hook): hides arrows/dots at 1 slide, shows them at 2+, feature
      cards swap after the fade-out delay

### Implementation for User Story 3

- [X] T016 [US3] Build `src/components/home/app-showcase-carousel.tsx`: one embla slide per app,
      title/subtitle/optional CTA, dark gradient overlay, prev/next arrows + dot indicators
      (hidden at 1 slide)
- [X] T017 [US3] Restructure `src/app/page.tsx` around an `apps: AppShowcaseSlide[]` array feeding
      `AppShowcaseCarousel`, replacing the single hardcoded hero + feature grid
- [X] T018 [US3] Fade-out/fade-in transition (not instant swap) for the feature-card grid as the
      active slide changes
- [X] T019 [US3] `inert` on off-screen slides — fixes axe `aria-hidden-focus` (research.md §3)
- [X] T020 [US3] Enlarge the dot indicators' clickable area to 24x24px, keeping the visual dot
      small — fixes Lighthouse `target-size`
- [X] T021 [US3] Add a temporary lorem-ipsum second slide proving 2+-slide behavior (arrows/dots
      appearing, feature cards changing) — see spec.md Assumptions for its removal condition
- [X] T022 [US3] Wire the Decision Journal slide's `backgroundImage` to a real photo
      (`public/img/image1.png`) via `next/image` (`fill` + `object-cover`) rather than a raw CSS
      `background-image`, for automatic optimization given the source file's size (~1.4MB)

**Checkpoint**: Home page renders as a real multi-app showcase; verified working with both one
slide and two.

---

## Phase 5: User Story 4 - Account popover fits a real name and reads as a button (P3)

### Tests for User Story 4

- [X] T023 [P] [US4] `tests/unit/user-menu.test.tsx` continues to pass unmodified post-fix
      (existing tests didn't assert on `role="menu"`, so removing it required no test changes)

### Implementation for User Story 4

- [X] T024 [US4] Widen `src/components/auth/user-menu.tsx`'s popover (`w-44` → `w-64`) to fit a
      long display name without truncating
- [X] T025 [US4] Style `src/components/auth/sign-out-button.tsx` as an actual button (border,
      padding, background) instead of a plain underlined text link
- [X] T026 [US4] Remove the popover's invalid `role="menu"` — fixes axe `aria-required-children`
      (research.md §3)

**Checkpoint**: Account popover verified with a long display name; Sign Out reads as a button.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T027 [P] Sticky positioning (`sticky top-0 z-20`) on `src/components/nav/nav-bar.tsx`'s
      `<header>`
- [X] T028 [P] Full axe verification: signed-in/signed-out, single-slide/two-slide carousel,
      account popover open, sign-in popover open, `/contact` in both auth states — 0 violations
      after the fixes in T019/T026
- [X] T029 [P] Lighthouse verification against a production build of the home page (real photo,
      two slides): Performance 81 / Accessibility 100 — within phases 1-4's established range
      (constitution Principle VII)
- [X] T030 Full suite: `npx tsc --noEmit` clean, 136/136 tests passing

---

## Dependencies & Execution Order

Built and verified in roughly the order listed above, though as direct, iterative instructions
rather than a pre-planned task queue (see plan.md header note). Retroactively, the dependency
shape is:

- **Foundational (Phase 1)**: blocks everything else (the dependency and the `isSignedIn` plumbing)
- **User Story 1 (Phase 2)**: depends on Foundational only
- **User Story 2 (Phase 3)**: depends on Foundational; independent of US1 in practice, though both
  touch `nav-links.tsx`
- **User Story 3 (Phase 4)**: depends on Foundational (the carousel dependency); independent of
  US1/US2
- **User Story 4 (Phase 5)**: fully independent of the other three stories
- **Polish (Final Phase)**: depends on all four stories being complete

## Notes

- This phase's stories touch three of the same shared files (`nav-links.tsx`, `nav-bar.tsx`) more
  than phases 1-4's stories typically did, since nav restructuring is inherently the kind of
  change that cuts across "which story owns this file" — noted here rather than treated as a
  process violation.
- Two real accessibility bugs and one real Lighthouse finding were caught by this phase's own
  verification pass, not anticipated in advance — recorded in research.md §3 for future reference.
