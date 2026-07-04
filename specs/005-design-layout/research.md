# Phase 0 Research: Design & Layout

## 1. Decisions subnav: restyle in place vs. move into a top-nav flyout

**Decision**: Remove the always-visible "My Decisions / Timeline / Dashboard" bar
(`decisions-subnav.tsx`) entirely; make "Decisions" in the top-level nav a click-to-open flyout
containing those same three links.

**Rationale**: The project owner was asked directly (recommended default vs. a narrower
alternative) and chose the full restructuring. It declutters every `/decisions/*` page (no bar
permanently occupying vertical space) and establishes a pattern that scales as more mini-apps ship
— each gets its own flyout from its own top-level nav item, rather than every app needing a
persistent per-page subnav bar.

**Alternatives considered**:
- **Restyle/reposition the existing bar without moving it into the nav** — offered as the
  narrower alternative; not chosen.

## 2. Carousel: hand-rolled vs. a library

**Decision**: `embla-carousel-react` (^8.6.0).

**Rationale**: The project owner was asked directly (recommended default: hand-rolled React state
+ CSS transitions, no new dependency, vs. a carousel library) and chose the library, for the more
polished/interactive feel (touch/swipe support, well-tested slide mechanics) over avoiding a new
dependency. Installed cleanly against React 19.2 with no peer-dependency overrides needed.

**Alternatives considered**:
- **Hand-rolled** (recommended default) — zero new dependency, full control over accessibility
  and fade timing. Not chosen — the project owner preferred a library's polish.
- Other carousel libraries (e.g. Swiper, Keen Slider) weren't separately evaluated once
  `embla-carousel-react` was named directly as the library option in the question the project
  owner answered.

## 3. Accessibility findings during this phase's own verification

Two real, previously-undetected violations were found (and fixed) via axe while verifying this
phase's work — not hypothetical risks, actual bugs:

- **`user-menu.tsx`'s popover used `role="menu"`** without `menuitem`-role children or arrow-key
  navigation, triggering axe's `aria-required-children`. This popover's *open* state had never
  actually been exercised by an axe scan before this phase — prior phases could only test the
  *signed-out* home page automatically, since completing a real Google/GitHub OAuth flow isn't
  automatable (phase 2 research.md §6). Testing it this time required crafting a valid Auth.js
  session JWT directly (matching the app's own `encode()`/salt/secret) rather than a real OAuth
  round-trip. **Fix**: removed `role="menu"` — this is a simple disclosure popover (a label plus
  one button), not a keyboard-navigable menu widget, so the ARIA role didn't fit what was actually
  built.
- **Off-screen carousel slides remained keyboard-focusable** despite `aria-hidden`, because
  `embla-carousel-react` keeps every slide in the DOM (sliding a flex container) rather than
  removing inactive ones. Axe's `aria-hidden-focus` caught a non-active slide's own CTA button
  still being reachable by Tab. **Fix**: `inert` on non-active slides instead of/in addition to
  `aria-hidden` — the same class of bug and the same fix as phase 3's calibration chart
  (`specs/003-calibration-dashboard/research.md` §2), now recorded here as a pattern to watch for
  with any future off-screen-but-present content.
- **Lighthouse (not axe) flagged the carousel's dot indicators** (`target-size`): the visual dot
  was 8x8px, below the 24x24px minimum touch-target guidance. **Fix**: kept the visual dot small
  but enlarged the clickable `<button>` around it to 24x24px.

## 4. Sign-in callback behavior

**Decision**: `signIn(provider, { callbackUrl: pathname })` using `usePathname()`, replacing a
hardcoded `callbackUrl: "/decisions"`.

**Rationale**: Once sign-in is reachable from a popover on any page (not just the home page's
hero CTA), redirecting everyone to `/decisions` after completing OAuth would yank a visitor away
from whatever page they were actually on. Returning them to that same page is the expected
behavior for a nav-level sign-in control, per explicit project owner direction.
