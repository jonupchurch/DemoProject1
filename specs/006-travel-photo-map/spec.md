# Feature Specification: Travel Photo Map

**Feature Branch**: `006-travel-photo-map`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Second mini-app on the site, per the constitution's Purpose section
— its own independent specify→plan→tasks→implement cycle, not part of Decision Journal's numbered
phase list. A travel/photo map app. Authenticated users can browse an interactive map, drop a pin
at a location, and upload a photo attached to that pin. Pinned photos and their coordinates are
publicly viewable by anyone, signed in or not, reusing the existing shared Postgres database and
Auth.js authentication (Google/GitHub) per the constitution's Shared Backend rule — no separate
database or auth system. Only the authenticated owner of a pin/photo may edit or delete it
(Principle VIII, Upload Ownership & Integrity); every other visitor, authenticated or not, may only
view. Location data comes only from the uploader's own map pin, never extracted from the image
file's metadata; before submitting, the UI must disclose that the pin and photo will be public; a
published pin shows its raw latitude/longitude plus a link out to an external map service — there
is no coordinate-precision or fuzzing control (Principle IX, Public Location Data Transparency).
The map itself must have a keyboard-operable, screen-reader-friendly non-map alternative for
browsing the same pinned locations (Principle IV). The UI must support dark mode from the site's
shared design tokens and reuse the site's shared motion vocabulary rather than inventing its own
(Principle VI), and any image-heavy view (the map's photo pins, a gallery) must use next/image with
responsive sizing and lazy-loading (Principle VII). Out of scope for this spec: choosing the
specific map-rendering library/tile provider and the photo storage backend — those are
architecturally significant, not-yet-fixed infrastructure choices explicitly deferred to this
feature's own /speckit-plan, not decided at the spec stage."

**Amendment (2026-07-04)**: the project owner clarified that a pin holds a gallery of one or more
photos, not a single photo each — updated throughout this spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish a pinned photo gallery (Priority: P1)

An authenticated person picks a spot on the map from somewhere they've traveled, uploads one or
more photos, and publishes them together as a pin — seeing plainly, before they confirm, that the
location and photos will be visible to anyone.

**Why this priority**: Nothing else in this app has value until pins exist. This is the only
content-creation path, so it is the MVP.

**Independent Test**: Can be fully tested by signing in, choosing a point on the map, uploading one
or more photos, confirming the public-visibility notice, submitting, and verifying the new pin
appears with all of its photos and its coordinates.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing the map, **When** they choose a point and upload one or
   more valid photos, **Then** a new pin is published at that point showing all of those photos.
2. **Given** an authenticated user partway through publishing a pin, **When** they reach the
   publish step, **Then** they see an explicit notice that the pin and its photos will be publicly
   visible before they can confirm.
3. **Given** an authenticated user, **When** they attempt to upload a file that isn't a valid image
   or exceeds the size limit, **Then** that upload is rejected with a clear error and the pin isn't
   published until every photo in it is valid.
4. **Given** someone who is not signed in, **When** they try to reach the publish flow, **Then**
   they are prompted to sign in first and no pin is created until they do.

---

### User Story 2 - Browse published pins publicly (Priority: P2)

Any visitor — signed in or not — opens the travel map and sees everyone's published photo galleries
and locations without needing an account.

**Why this priority**: This is the actual showcase experience for anyone who isn't the site owner,
and it must work without requiring a visitor to sign in at all. It depends on at least one pin
existing (User Story 1), but is independently testable against already-published pins.

**Independent Test**: With one or more pins already published, load the app while signed out and
confirm every pin's photos and coordinates are visible, both on the visual map and via the non-map
accessible list.

**Acceptance Scenarios**:

1. **Given** published pins exist, **When** a signed-out visitor opens the app, **Then** they see
   every pin's photos and location without being prompted to sign in.
2. **Given** a visitor viewing a pin, **When** they look at its location, **Then** they see its raw
   latitude/longitude and a link to an external map service for that coordinate.
3. **Given** a pin with more than one photo, **When** a visitor opens that pin, **Then** all of its
   photos are viewable together as a gallery, not just a single cover image.
4. **Given** a visitor who cannot or prefers not to use the visual map, **When** they switch to the
   list view, **Then** they can reach the same set of pins and coordinates using only the keyboard
   or a screen reader.
5. **Given** no pins have been published yet, **When** any visitor opens the app, **Then** they see
   a clear "no pins yet" message instead of a blank or broken view.

---

### User Story 3 - Manage your own pins (Priority: P3)

An authenticated person who published a pin later wants to fix a typo in its caption, nudge its
location, add or remove photos from its gallery, or remove the whole pin — and only they can do so.

**Why this priority**: A trust/correctness layer on top of an app that is already fully functional
(publish + browse) without it.

**Independent Test**: As a pin's owner, edit its caption and location, add a photo, and remove a
photo, confirming each change is visible publicly; then, signed in as a different account, attempt
the same edit/delete/photo changes and confirm they're all rejected.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing one of their own pins, **When** they edit its caption or
   location, **Then** the update is saved and visible to every visitor.
2. **Given** an authenticated user viewing one of their own pins, **When** they add a new photo to
   its gallery or remove an existing one (leaving at least one photo), **Then** the gallery reflects
   that change for every visitor.
3. **Given** an authenticated user viewing one of their own pins, **When** they delete it entirely,
   **Then** it and every one of its photos no longer appear anywhere, for any visitor.
4. **Given** an authenticated user viewing a pin they do not own, **When** they look for edit/
   delete/photo-management controls, **Then** none are shown.
5. **Given** an authenticated user attempts to edit, delete, or change the photos of a pin they
   don't own by bypassing the UI (e.g. a direct request), **When** that request is processed,
   **Then** it is rejected and the pin is unchanged.

---

### Edge Cases

- What happens when someone who isn't signed in tries to reach the "publish a pin" flow directly
  (e.g., a bookmarked URL)? They're redirected to sign in first, the same way `/decisions` and
  `/contact` already behave.
- What happens when one of the uploaded files isn't a valid image, or exceeds the size limit? That
  file is rejected server-side with a clear error; the pin (and its other, valid photos) is not
  published until the problem is fixed.
- What happens when an owner tries to remove the last remaining photo from a pin? The removal is
  blocked with a clear message — a pin MUST always retain at least one photo; deleting the whole
  pin is the way to remove its last photo.
- What happens when someone attempts to edit, delete, or change the photos of a pin they don't own,
  for example by guessing or reusing another pin's edit URL? The request is rejected exactly as an
  unauthorized edit of another account's data would be (constitution Principle VIII); the pin is
  unchanged.
- What happens when two different accounts publish pins at the same or nearly identical
  coordinates? Both pins are published and shown independently; there is no deduplication or
  merging.
- What happens when the public map or list has zero pins at all (a brand-new site)? Visitors see a
  clear "no pins published yet" state rather than an empty, unexplained view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let an authenticated user choose a point on an interactive map and
  publish a pin there together with one or more photos.
- **FR-002**: System MUST require the creator of a pin to be authenticated; unauthenticated
  visitors MUST NOT be able to create, edit, or delete a pin or any of its photos (constitution
  Principle VIII, NON-NEGOTIABLE).
- **FR-003**: Before a pin is submitted, the UI MUST clearly disclose that the pin and its photos
  will be publicly visible to any visitor, signed in or not (constitution Principle IX,
  NON-NEGOTIABLE).
- **FR-004**: System MUST record a pin's location only from the uploader's own map selection made
  at upload time; the system MUST NOT read, extract, or persist location data from any uploaded
  image file's own metadata (constitution Principle IX, NON-NEGOTIABLE).
- **FR-005**: System MUST let any visitor, signed in or not, browse a map of every published pin
  and view each pin's photos and location.
- **FR-006**: A published pin's location MUST be shown as its raw latitude/longitude, together with
  a link to an external map service for that coordinate (constitution Principle IX).
- **FR-007**: A pin with more than one photo MUST display all of its photos together as a gallery
  when a visitor opens that pin, not only a single cover image.
- **FR-008**: System MUST provide a keyboard-operable, screen-reader-friendly list view of every
  published pin (at minimum its coordinates and caption, if any) as a non-map alternative for
  browsing the same locations (constitution Principle IV).
- **FR-009**: System MUST let the authenticated account that created a pin edit its caption and/or
  reposition it, add photos to its gallery, remove individual photos from its gallery, and delete
  the pin (and every one of its photos) entirely.
- **FR-010**: A pin MUST always retain at least one photo; removing a photo that would leave the
  pin with zero MUST be rejected, with deleting the whole pin as the way to accomplish that.
- **FR-011**: System MUST NOT allow any account other than a pin's original creator to edit,
  delete, or change the photos of it, under any circumstance (constitution Principle VIII,
  NON-NEGOTIABLE).
- **FR-012**: Edit/delete/photo-management controls for a pin MUST be shown only to the account
  that created it; no other viewer, authenticated or not, sees them.
- **FR-013**: System MUST validate each uploaded photo server-side as an image of an acceptable
  type and size before accepting it; invalid files MUST be rejected with a clear error, and nothing
  is published until every photo in the pin is valid (constitution Principle VIII).
- **FR-014**: System MUST let an uploader attach an optional caption to a pin; a pin MUST remain
  valid with no caption.
- **FR-015**: System MUST authenticate users through the site's existing shared sign-in (Google/
  GitHub) and persist pins and photos in the site's existing shared database — no separate
  sign-in flow or data store for this app (constitution's Shared Backend rule).

### Key Entities *(include if feature involves data)*

- **Pin**: A single published location on the map. Has an owner (the authenticated account that
  created it), a latitude/longitude chosen by the owner, an optional caption, a creation timestamp,
  and one or more Photos. Publicly viewable by anyone; only its owner may edit, delete, or change
  its photos.
- **Photo**: An individual uploaded image belonging to exactly one Pin, displayed as part of that
  pin's gallery alongside the pin's other photos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Any visitor, signed in or not, can view every published pin's photos and location
  without needing to sign in or take any extra step.
- **SC-002**: An authenticated user can publish a new pin — pick a location, upload one or more
  photos — in a single straightforward flow, seeing a clear notice that it will be public before
  they confirm.
- **SC-003**: 100% of edit/delete/photo-management attempts on a pin succeed only when made by that
  pin's original creator and are rejected for every other account.
- **SC-004**: Every published pin's location is reachable through a non-map, fully keyboard- and
  screen-reader-operable view, not only the visual map.
- **SC-005**: A pin with multiple photos always presents them together as a browsable gallery,
  never limited to a single image.
- **SC-006**: A map view showing dozens of pins remains responsive and interactive within a few
  seconds on a typical connection.

## Assumptions

- A pin is a location that can hold a gallery of one or more photos, not a single photo each; an
  owner may add or remove individual photos from an existing pin's gallery over time, as long as at
  least one photo always remains (FR-010).
- No maximum number of photos per pin is specified here; a practical limit, if any, is a plan-level
  decision, not a product requirement.
- No content moderation, reporting, or approval queue exists for public uploads in this version;
  publishing is immediate once the authenticated owner submits. Revisiting this is possible later
  if it becomes a real concern, but isn't warranted for an initial, personal-portfolio-scale
  version (Principle I).
- No limit exists on how many pins one account may publish, and no restriction prevents multiple
  pins at the same or very close coordinates.
- The map-rendering library/tile provider and the photo storage backend are not yet fixed and are
  explicitly deferred to this feature's own `/speckit-plan`, per the constitution's Shared Backend
  note — this spec describes required behavior only, not how it's implemented.
- No dedicated search/filter/browse-by-region capability for pins exists in this version — out of
  scope, consistent with keeping the initial version simple (Principle I).
