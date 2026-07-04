# Implementation Plan: Design & Layout

**Branch**: `005-design-layout` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-design-layout/spec.md`

**Note**: Written retroactively — implementation came first, built directly per the project
owner's explicit instructions across a single working session, then verified (tests, axe,
Lighthouse) before this plan was written to match. Two architecturally significant choices were
still made consultatively before implementing, via direct questions to the project owner (see
research.md §1-2), consistent with how DB/ORM/auth-library and phase 3's charting-library choices
were made in earlier phases.

## Summary

Restructures site navigation (a per-app flyout menu instead of a persistent subnav bar; sticky
positioning; button-styled sign-in/sign-out, each behind a popover), establishes a strict
public/private page boundary (only Home/About are reachable signed-out; every mini-app and the
new Contact page require sign-in), and turns the home page into an actual multi-app showcase (a
carousel with one slide per mini-app, feature cards that fade-transition to match the active
slide). This is the first real use of the constitution's "multi-app scaffolding" — built now with
exactly one real slide (Decision Journal) plus one temporary lorem-ipsum slide proving the
mechanism handles 2+ slides correctly.

## Technical Context

**Language/Version**: TypeScript 5.x strict, Next.js 16 (App Router) / React 19 — unchanged from
phases 1-4

**Primary Dependencies**: `embla-carousel-react` (NEW — see research.md §2 for why a library was
chosen over a hand-rolled carousel). No other new dependencies.

**Storage**: No changes. This phase touches only UI/routing/navigation, not data.

**Testing**: Vitest, extending the existing suite. Interactive components with real conditional
logic (nav flyout, sign-in/account popovers, the carousel) get unit tests per Principle II;
`embla-carousel-react`'s own hook is mocked in the carousel's test so the surrounding
open/closed/fade logic is tested without depending on real DOM layout measurement.

**Target Platform**: Vercel serverless — unchanged.

**Project Type**: Web application — same single Next.js project.

**Performance Goals**: Same Lighthouse 95+ Performance/Accessibility targets (Principle VII).
Measured 81/100 (Performance/Accessibility) on the home page with the carousel and a real
background photo — within the already-established 78-91 Performance range from phases 1-4.

**Constraints**:
- **Access boundary is enforced the same way every gated route already works**: `proxy.ts`'s edge
  matcher and each page's own `requireCurrentUserId()` call (defense-in-depth per CVE-2025-29927,
  established in phase 2) — `/contact` was added to both, exactly like `/decisions/:path*`. Nav
  *visibility* (hiding links) is a separate, additional layer on top of that access control, not a
  replacement for it — a hidden-but-unlinked route would still need to be independently protected.
- **Off-screen carousel slides must be `inert`, not just `aria-hidden`**: `embla-carousel-react`
  keeps every slide in the DOM (sliding a flex container), so a non-active slide's own CTA button
  remains keyboard-focusable unless explicitly made inert — the same class of bug phase 3's
  calibration chart had (research.md §3).
- **The account/sign-in popovers are not `role="menu"`**: that ARIA role requires `menuitem`
  children with arrow-key navigation, which these simple disclosure popovers (a label/buttons, no
  arrow-key traversal) don't implement — using it anyway is an axe `aria-required-children`
  violation, found during this phase's own verification (research.md §3).
- **Sign-in's `callbackUrl` follows the current page** (`usePathname()`), not a hardcoded route —
  necessary once sign-in is reachable from a popover on any page, not just the home page's hero.

**Scale/Scope**: Unchanged single-user-at-a-time personal tool assumption.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Type Safety & Simplicity** — PASS. The nav flyout, popovers, and carousel each reuse the
  existing open/close-on-outside-click/Escape pattern already established by `user-menu.tsx`
  rather than inventing parallel mechanisms. `embla-carousel-react` is a real dependency addition,
  but a consulted-on, explicit choice (Complexity Tracking), not an unrequested abstraction.
- **II. Extensive Test Coverage (NON-NEGOTIABLE)** — PASS (enforced in tasks). Every interactive
  component touched or added this phase (nav flyout, sign-in popover, sign-in buttons' callbackUrl
  behavior, the carousel's slide/fade logic) has unit coverage.
- **III. Privacy & Data Ownership (NON-NEGOTIABLE)** — PASS, and this phase is where the
  public/private *page* boundary (as opposed to *data* boundary, already enforced since phase 2)
  gets drawn explicitly: Home/About are the only pages a signed-out visitor can reach at all; every
  other route redirects, exactly like `/decisions/*` already did.
- **IV. WCAG 2.1 AA Accessibility (NON-NEGOTIABLE)** — PASS, with two real violations found and
  fixed via axe during this phase's own verification (not hypothetical): the account popover's
  invalid `role="menu"` usage, and off-screen carousel slides being focusable despite
  `aria-hidden`. Also fixed a Lighthouse `target-size` finding (carousel dot indicators had an
  8x8px hit target; enlarged the clickable area to 24x24px while keeping the visual dot small).
  0 violations after fixes, across signed-in/signed-out and single/multi-slide states.
- **V. Transparent AI Assistance** — N/A (and dormant per the v2.0.0 constitution amendment — no
  AI content anywhere in this phase).
- **VI. Clean, Elegant Design** — PASS. New UI (flyout, popovers, carousel) reuses existing
  Tailwind design tokens (`brand-*`, `rounded-card`) rather than introducing new ad hoc styles.
- **VII. Performance & Quality Bar (Lighthouse)** — **Measured**: home page (with the carousel,
  a real background photo, two slides) scored Performance 81 / Accessibility 100 on a production
  build — within phases 1-4's established 78-91 range, confirming the new dependency didn't
  regress this gate.

No unresolved violations against NON-NEGOTIABLE principles. One dependency addition recorded in
Complexity Tracking below.

## Project Structure

### Documentation (this feature)

```text
specs/005-design-layout/
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── tasks.md                   # Phase 2 output — all tasks already complete (retroactive)
└── checklists/
    └── requirements.md
```

(No `data-model.md`/`contracts/` — this phase touches no data model or new query/action
boundaries; it's entirely UI/routing.)

### Source Code (repository root)

```text
src/
├── proxy.ts                          # matcher extended: "/decisions/:path*" -> also "/contact"
├── app/
│   ├── page.tsx                      # rebuilt around AppShowcaseCarousel; two slides today
│   ├── contact/
│   │   └── page.tsx                  # NEW: gated placeholder (requireCurrentUserId, matches
│   │                                 # every other protected page's pattern)
│   └── decisions/
│       └── layout.tsx                # simplified: DecisionsSubnav removed (moved into the
│                                     # top-level nav's flyout instead)
├── components/
│   ├── nav/
│   │   ├── nav-bar.tsx               # sticky positioning; passes isSignedIn to NavLinks;
│   │   │                             # renders SignInMenu instead of a plain "Sign in" link
│   │   └── nav-links.tsx             # Decisions becomes a flyout trigger + menu; Decisions/
│   │                                 # Contact hidden entirely when signed out
│   ├── auth/
│   │   ├── sign-in-menu.tsx          # NEW: popover mirroring user-menu.tsx's pattern, houses
│   │   │                             # SignInButtons
│   │   ├── sign-in-buttons.tsx       # callbackUrl now follows usePathname() instead of a
│   │   │                             # hardcoded "/decisions"; GitHub button given a solid
│   │   │                             # white background (was relying on inherited text color,
│   │   │                             # unreadable once placed on a dark hero background)
│   │   ├── sign-out-button.tsx       # styled as an actual button, not a text link
│   │   └── user-menu.tsx             # popover widened (w-44 -> w-64); role="menu" removed
│   │                                 # (axe aria-required-children — see Constraints)
│   ├── decisions/
│   │   └── decisions-subnav.tsx      # DELETED — superseded by nav-links.tsx's flyout
│   └── home/
│       └── app-showcase-carousel.tsx # NEW: embla-carousel-react wrapper; hides prev/next/dots
│                                     # at 1 slide; inert (not just aria-hidden) off-screen
│                                     # slides; fade-out/in transition for the feature-card grid
├── public/
│   └── img/
│       └── image1.png                # Decision Journal slide's real background photo
tests/
└── unit/
    ├── nav-links.test.tsx            # extended: isSignedIn gating, flyout open/close
    ├── user-menu.test.tsx            # unchanged behavior, still passes post-ARIA-fix
    ├── sign-in-menu.test.tsx         # NEW
    ├── sign-in-buttons.test.tsx      # NEW: callbackUrl follows current pathname
    └── app-showcase-carousel.test.tsx # NEW: single vs. multi-slide chrome, fade timing
```

**Structure Decision**: Single Next.js App Router project, unchanged. `/contact` is a flat
top-level route (not nested under an app namespace), consistent with the constitution's Multi-App
Structure rule and matching how `/decisions` itself is a flat route.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency: `embla-carousel-react` | Project owner was offered a hand-rolled, zero-dependency carousel as the recommended simpler default and explicitly chose a carousel library instead (research.md §2). | The zero-dependency approach was presented and available; not the option chosen by the person whose call this is. |
