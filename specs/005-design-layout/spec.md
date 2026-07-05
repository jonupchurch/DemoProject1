# Feature Specification: Design & Layout

**Feature Branch**: `005-design-layout`

**Created**: 2026-07-04

**Status**: Draft

**Note**: Written retroactively to match an implementation that was built directly, one
instruction at a time, per the project owner's explicit direction — the same practice used for
phase 2's "Post-Implementation Amendments," except here no spec existed yet for this phase to
amend, so this is the initial spec/plan/tasks for it instead.

**Input**: User description (paraphrased from a sequence of direct instructions): "For Design &
Layout: (1) move the Decisions submenu into a fly-out from the top nav instead of an always-visible
bar; (2) make the account popover bigger so a longer name fits, and style Sign out like a real
button; (3) turn the home page into a multi-app showcase — a carousel with one slide per mini-app,
where the 3 feature boxes below change to match whichever slide is active; the carousel should
support a title, subtitle, CTA, and a background image with a dark gradient so the text stays
readable; (4) make the nav sticky to the top of the window; (5) make Sign in look like a button
too, and give it a popover offering Google/GitHub, the same way the account menu works; (6) only
Home and About should be visible/reachable when signed out — every mini-app (Decisions today, more
later) and a new Contact page are hidden and inaccessible until sign-in; (7) add a temporary
lorem-ipsum second carousel slide to prove the multi-slide behavior actually works; (8) the feature
card transition when the carousel changes slides should be a fade-out/fade-in, not an instant swap."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Signed-out visitor sees only the public surface (Priority: P1)

A visitor who hasn't signed in sees a minimal, public portfolio surface — Home and About only —
and can sign in from anywhere without first having to navigate back to the home page.

**Why this priority**: This is the core access-control model this phase establishes for the whole
site going forward: everything that isn't Home/About is a personal tool behind sign-in, not a
public page. Every other story in this phase assumes this boundary exists.

**Independent Test**: Visit the site signed out; confirm only Home and About appear in navigation,
confirm direct URLs to any mini-app or `/contact` redirect back to the home page, and confirm a
sign-in popover (Google/GitHub) is reachable from the nav on every page.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor on any page, **When** they look at the navigation, **Then** they
   see only Home and About — no mini-app links and no Contact link.
2. **Given** a signed-out visitor, **When** they visit a mini-app's URL directly (e.g.
   `/decisions`) or `/contact` directly, **Then** they are redirected to the home page rather than
   seeing any gated content.
3. **Given** a signed-out visitor on any page, **When** they click "Sign in" in the nav, **Then** a
   popover opens offering "Continue with Google" and "Continue with GitHub", without navigating
   away from the page they were on.
4. **Given** a signed-out visitor on, say, the About page, **When** they complete sign-in, **Then**
   they land back on the About page, not on a fixed route like `/decisions`.

---

### User Story 2 - Signed-in user reaches a mini-app's pages via a nav flyout (Priority: P1)

A signed-in user opens a mini-app's sub-pages (for Decision Journal: My Decisions, Timeline,
Dashboard) from a flyout menu on the top-level nav, rather than a bar that took up space on every
page of that app.

**Why this priority**: Directly replaces the phase 3 per-app subnav bar with a pattern that scales
as more mini-apps ship, each getting their own flyout instead of the page constantly showing a
static row of tabs.

**Independent Test**: Sign in, click "Decisions" in the top nav, confirm a flyout opens with My
Decisions/Timeline/Dashboard, confirm it closes on outside-click/Escape/selecting an item, and
confirm no separate subnav bar remains on any `/decisions/*` page.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they click "Decisions" in the top nav, **Then** a flyout
   appears listing My Decisions, Timeline, and Dashboard.
2. **Given** the flyout is open, **When** the user presses Escape or clicks outside it, **Then** it
   closes.
3. **Given** a signed-in user on any `/decisions/*` page, **When** they look at the page layout,
   **Then** there is no separate always-visible subnav bar — only the top nav's flyout.

---

### User Story 3 - Home page showcases every mini-app via a carousel (Priority: P2)

Any visitor (signed in or out) sees the home page present each mini-app on the site as its own
carousel slide — title, subtitle, background image with a dark gradient for legibility, and a
call-to-action — with the three feature cards below updating, via a fade transition, to match
whichever slide is currently active.

**Why this priority**: The actual "multi-app scaffolding" this phase's name refers to. Valuable
and visible immediately, but the site remains fully functional for its one real app even before
this exists.

**Independent Test**: Load the home page with only one mini-app configured — confirm it renders as
a plain hero with no carousel chrome. Add a second slide — confirm prev/next arrows and dot
indicators appear, clicking through them changes the hero background/title/subtitle/CTA and,
after a brief fade-out/fade-in, the three feature cards below.

**Acceptance Scenarios**:

1. **Given** only one mini-app slide exists, **When** the home page loads, **Then** no prev/next
   arrows or dot indicators are shown — it renders as a single static hero.
2. **Given** two or more mini-app slides exist, **When** the home page loads, **Then** prev/next
   arrows and one dot per slide appear, and using them changes the active slide.
3. **Given** the active slide changes, **When** the transition happens, **Then** the three feature
   cards below fade out, then the new slide's feature cards fade in — not an instant swap.
4. **Given** a slide has a background image configured, **When** it renders, **Then** a dark
   gradient overlay sits between the image and the text so the title/subtitle remain readable
   regardless of the image underneath.
5. **Given** a slide currently scrolled off-screen (not the active one), **When** a keyboard user
   tabs through the page, **Then** that slide's own controls (e.g. its CTA button) are not
   reachable by keyboard focus.

---

### User Story 4 - Account popover fits a real name and reads as a button (Priority: P3)

A signed-in user opens their account popover and sees their full display name without awkward
truncation, with a Sign Out control that's clearly a clickable button rather than a plain text
link.

**Why this priority**: A refinement of existing, already-functional sign-out behavior — valuable
polish, not a blocking capability.

**Independent Test**: Sign in with an account that has a long display name; open the account
popover; confirm the name fits without truncating on one line at a reasonable width, and confirm
the Sign Out control is styled as a bordered/padded button.

**Acceptance Scenarios**:

1. **Given** a signed-in user with a long display name, **When** they open the account popover,
   **Then** their name is fully visible without truncation.
2. **Given** the account popover is open, **When** the user looks at the Sign Out control,
   **Then** it is visually a button (border, padding, background), not a plain underlined link.

---

### Edge Cases

- What happens when a mini-app or Contact is linked to directly while signed out (not discovered
  via nav)? Same as any other gated route — redirected to the home page (User Story 1, scenario
  2), with defense-in-depth (edge proxy fast-path plus a server-side re-check on the page itself,
  consistent with every other gated route since phase 2).
- What happens when only one carousel slide exists, and a screen reader user reaches it? It reads
  as an ordinary hero section — no misleading carousel semantics (prev/next controls, live region)
  are present when there's nothing to navigate between.
- What happens to the temporary lorem-ipsum second slide? It was explicitly a placeholder to prove
  the multi-slide mechanics work correctly; **resolved 2026-07-04** — its content was replaced with
  Travel Photo Map's real copy/CTA once that app shipped (Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show only Home and About in navigation, and MUST allow access only to
  those two pages (plus the sign-in flow itself), to a signed-out visitor.
- **FR-002**: System MUST hide every mini-app's nav entry and the Contact nav entry from a
  signed-out visitor, and MUST redirect a signed-out visitor who reaches any of those routes
  directly to the home page.
- **FR-003**: System MUST let a signed-out visitor sign in (Google or GitHub) via a popover
  reachable from the nav on every page, without requiring navigation to the home page first.
  Completing sign-in MUST return the visitor to the page they signed in from, not redirect them
  to a fixed route.
- **FR-004**: System MUST present a signed-in user's mini-app sub-pages (for Decision Journal: My
  Decisions, Timeline, Dashboard) via a flyout menu triggered from that app's top-level nav item.
- **FR-005**: The flyout MUST close on outside click, on Escape, and upon selecting one of its
  links.
- **FR-006**: The navigation bar MUST remain visible at the top of the viewport while the page is
  scrolled (sticky/fixed positioning).
- **FR-007**: System MUST present the home page as a carousel with exactly one slide per
  configured mini-app, each slide showing that app's title, subtitle, an optional background image
  with a dark gradient overlay for text legibility, and an optional call-to-action.
- **FR-008**: System MUST hide carousel navigation chrome (prev/next arrows, dot indicators) when
  only one slide is configured, and MUST show it automatically once two or more slides exist.
- **FR-009**: System MUST update the three feature cards below the carousel to match the active
  slide, transitioning via a fade-out-then-fade-in rather than an instant content swap.
- **FR-010**: System MUST NOT allow keyboard focus to reach interactive elements (e.g. a slide's
  CTA) belonging to a carousel slide that is not the currently active one.
- **FR-011**: The account popover MUST accommodate a full display name without truncating at
  typical name lengths, and MUST present its Sign Out control as a clearly clickable button
  (visually distinct from a plain text link).
- **FR-012**: System MUST provide a Contact page, gated the same way as every other mini-app (FR-002)
  — hidden from nav and inaccessible while signed out.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-out visitor can identify, within a few seconds of landing on any page, that
  only Home/About are available to browse and that signing in is one click away.
- **SC-002**: A signed-in user reaches any of Decision Journal's three sub-pages in two clicks or
  fewer from any page on the site.
- **SC-003**: 0% of carousel slides that aren't currently active expose any keyboard-focusable
  control.
- **SC-004**: 0 accessibility violations (automated axe scan) across signed-in/signed-out and
  single-slide/multi-slide carousel states.
- **SC-005**: Lighthouse Performance and Accessibility scores on the home page remain within the
  range already established in phases 1-4, despite the added carousel dependency.

## Assumptions

- Contact is itself a private, personal tool in the same spirit as Decision Journal (e.g., a future
  personal contacts/CRM-style mini-app), not a public "reach out to me" form — this is why it is
  gated behind sign-in the same way mini-apps are, per the project owner's explicit instruction,
  rather than left public the way a typical portfolio contact form would be.
- The lorem-ipsum second carousel slide was a deliberate, temporary placeholder added solely to
  prove the carousel's multi-slide mechanics (navigation chrome appearing, feature cards updating)
  work correctly before any real second mini-app existed. **Resolved 2026-07-04**: replaced with
  Travel Photo Map's real copy/CTA once that app shipped (`specs/006-travel-photo-map/`) — the
  same background photo was kept, only the text/features/CTA changed.
- A new lorem-ipsum third carousel slide was added 2026-07-04, the same kind of temporary
  placeholder as above, this time proving 3+-slide behavior ahead of a real third mini-app. It uses
  `/img/image3.png` as its background. Expect it to be replaced with a real mini-app's copy/CTA the
  same way the second placeholder was, once that app ships.
- A slide's background image is optional; without one, a gradient (matching the site's existing
  design tokens) is used instead. The Decision Journal slide's image is a real photo supplied by
  the project owner; future slides may or may not have one.
- No auto-rotation: the carousel only advances via explicit user action (arrows/dots), avoiding the
  WCAG pause/stop/hide requirements that auto-advancing carousels take on — moot at 1-2 slides today
  and a reasonable default going forward.
- Out of scope: a full design-token/typography audit beyond what this phase's specific changes
  touched, and the actual Contact page's real functionality (it ships here only as a gated,
  placeholder route — see plan.md).
