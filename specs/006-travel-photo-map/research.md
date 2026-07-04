# Phase 0 Research: Travel Photo Map

## 1. Map rendering library and tile source

**Decision**: `maplibre-gl` directly, wrapped in one small in-house Client Component
(`components/travel/travel-map.tsx`) rather than adding `react-map-gl` as a further dependency —
MapLibre's own API is imperative/DOM-based and modest for this feature's needs (one map, marker
rendering, click-to-pin), so a full React-binding library would mostly re-expose an API a thin
wrapper already covers, for a marginal benefit that doesn't justify the extra dependency
(Principle I). Rendering free vector tiles from a keyless/no-account source (OpenFreeMap;
MapTiler's free tier as a fallback if OpenFreeMap's coverage or reliability proves insufficient
during implementation). The "view on an external map service" link required by FR-006 points to
OpenStreetMap's own web viewer (`https://www.openstreetmap.org/?mlat={lat}&mlon={lon}`), keeping
the whole map experience on one open ecosystem rather than mixing map vendors.

**Rationale**: The project owner was asked directly (recommended default vs. two alternatives) and
chose MapLibre. It's open-source with no API key or billing account required against a free tile
source, avoiding a new paid-vendor dependency the way Mapbox GL would introduce one. Unlike Leaflet
+ raster tiles, MapLibre renders modern vector tiles with smooth pan/zoom/fly-to animation out of
the box, which directly serves the constitution's newly amended Principle VI ("striking and
polished... motion") — a real, non-hypothetical design requirement for this specific app, not
generic polish.

**Alternatives considered**:
- **Leaflet + OpenStreetMap raster tiles** — the simpler, more-tutorialized option (closer to
  Principle I's "simplest design" in isolation), also free and keyless. Not chosen: plain raster
  tiles with no built-in smooth camera motion would need real extra work to meet Principle VI's
  motion requirement, undoing the simplicity advantage.
- **Mapbox GL JS** — most polished/customizable, and MapLibre is itself a fork of Mapbox GL v1, so
  the two are closely related technically. Not chosen: requires a Mapbox account, an API key, and
  has usage-based billing beyond a free-load quota — a recurring vendor dependency for a personal
  project with unpredictable, possibly-zero real traffic.

**Constraint this creates**: MapLibre GL JS reads `window`/`document` and paints to a canvas at
import time, so the map component MUST be a Client Component, dynamically imported with SSR
disabled (`next/dynamic`, `ssr: false`) — attempting to render it during server-side rendering or
static generation will fail. This is an unavoidable consequence of using any real interactive map
library, not a design choice to revisit.

## 2. Photo file storage

**Decision**: Store uploaded photo bytes behind a small `PhotoStorage` interface with two
implementations, selected by environment (mirroring how this project already runs local Postgres
in dev/test and a different connection in production, per phase 1's research.md §2):
- **Production**: Vercel Blob.
- **Local dev and integration tests**: the local filesystem, under a gitignored directory (e.g.
  `.data/photo-storage/`), served back through a small internal route rather than `public/` (so
  test/dev uploads never get committed or need `public/` cleanup).

**Rationale**: The project owner was asked directly (Vercel Blob vs. an S3-compatible alternative)
and picked Vercel Blob for production — it's native to the already-fixed Vercel deployment target
(constitution Technology Constraints), so no new vendor account or credentials are needed to ship.
For local dev/test, the project owner explicitly said either the local filesystem or storing
photos in the database would be fine; the filesystem is chosen over the database because it avoids
bloating the relational database with binary data (a real performance concern Principle VII already
flags for image-heavy views) and keeps test fixtures trivially inspectable and disposable as plain
files, matching this project's existing `resetDecisions()`-style integration-test cleanup pattern
(`tests/integration/setup.ts`) rather than adding schema-level binary columns.

**Alternatives considered**:
- **S3-compatible storage (e.g. Cloudflare R2)** — more portable/vendor-neutral long-term, and
  often cheaper at real scale. Not chosen for production: adds a second cloud vendor's account and
  credentials to a stack that is otherwise fully Vercel + Postgres, for a personal-scale project
  where Vercel Blob's free tier is already sufficient.
- **Storing photo bytes in Postgres** (`bytea`) — explicitly acceptable to the project owner as a
  dev/test option, but not chosen even there: it risks becoming the path of least resistance into
  production too, which would directly work against Principle VII's image-optimization/performance
  requirements for this specific app. The filesystem gets the same "no new cloud account needed
  locally" benefit without that risk.

**Interface shape** (documented here so it's binding, not re-litigated per task):
```
interface PhotoStorage {
  put(file: Buffer, contentType: string): Promise<{ url: string }>;
  delete(url: string): Promise<void>;
}
```
The driver is chosen once, at startup, based on `NODE_ENV`/an explicit env var — call sites
(`lib/travel.ts`-equivalent data-access functions) depend only on the `PhotoStorage` interface, not
on which driver is active. This is the same shape Prisma's adapter pattern already uses in this
codebase (`src/lib/db.ts`), so it's a consistent pattern rather than a new one.

## 3. Upload validation limits

**Decision**: Accept JPEG, PNG, and WebP only; reject any other MIME type server-side. Cap each
photo at 10 MB.

**Rationale**: FR-013 requires server-side type/size validation but the spec deliberately left
exact numbers unspecified (a product-scope question, not a user-facing requirement). These three
formats cover effectively all camera/phone photo output and modern re-encoding; 10 MB comfortably
fits a high-resolution phone photo without letting a single upload become a Performance-principle
liability once `next/image` optimizes it for display (constitution Principle VII, expanded this
amendment). Both numbers are plan-level defaults, not spec requirements, and can be revisited in a
future amendment without re-opening the spec.

**Alternatives considered**: Also accepting HEIC (native iPhone format) — rejected for v1 because
it needs server-side transcoding to be viewable in most browsers, adding real complexity (Principle
I) for a format most photo apps already convert to JPEG on export/share.

## 4. Non-map accessible list view

**Decision**: A plain Server Component list (same pattern as `/decisions`'s existing list page),
querying the same Pin/Photo data as the map, rendered as semantic HTML (`<ul>`/`<li>`, real links)
rather than a cut-down version of the map itself.

**Rationale**: Constitution Principle IV requires this to be independently keyboard/screen-reader
operable, which a simplified map widget typically cannot guarantee (the same class of issue phase
3's calibration chart and phase 5's carousel both hit with axe). A plain server-rendered list sidesteps
that risk entirely rather than trying to retrofit accessibility onto a second visual widget.

**Alternatives considered**: An ARIA-heavy accessible re-skin of the map component itself — rejected
as substantially more implementation risk for the same outcome a plain list already achieves for
free.

## 5. Upload transport: client-side, not through a Server Action (added during implementation)

**Decision**: `createPin`/`addPhotoToPin` never receive raw file bytes. A photo is uploaded
*before* either Server Action runs, via a small client helper (`src/lib/upload-photo.ts`) that:
- In production, uploads the file directly from the browser to Vercel Blob using a short-lived
  client token (`@vercel/blob/client`'s `upload()`, with the token issued by
  `src/app/api/travel-photos/upload-token/route.ts`, which requires an authenticated session
  before issuing one).
- In dev/test, `POST`s the file to a same-origin Route Handler
  (`src/app/api/travel-photos/upload-local/route.ts`) backed by the local-filesystem `PhotoStorage`
  driver (§2).

Either way, the Server Action only ever receives `{ url, contentType }` references
(`UploadedPhoto`, `src/lib/travel-types.ts`) — never a `File`. Per-file type/size validation
(`validatePhotoFile`, §3) moved from `createPin`'s own validation into these two upload paths,
since that's now the only place a raw file is ever seen server-side.

**Rationale**: Manual testing against a real dev server surfaced that Next's Server Action body
parser defaults to a 1MB limit — an easy local fix (`serverActions.bodySizeLimit` in
`next.config.js`). But raising that limit only helps locally: **Vercel's serverless functions
enforce a hard, non-configurable 4.5MB request-body cap**, which applies to Server Actions and
Route Handlers alike once actually deployed there. A single modern phone photo routinely exceeds
that on its own, well before even considering a multi-photo gallery in one request. Vercel's own
documented fix for exactly this problem is client-side direct upload via `@vercel/blob/client` —
the browser talks to Blob storage directly, so the file's bytes never pass through a serverless
function at all, sidestepping the cap entirely rather than working around it. The project owner
was asked directly (fix now vs. defer until actual deployment) and chose to fix it now, to avoid
finding out about this the day of a real deploy.

**Alternatives considered**:
- **Defer to deployment day** — the option not chosen; would have meant discovering this as a
  production-only failure late, with `createPin`'s contract needing to change anyway at that point.
- **Multipart/base64 chunking through the Server Action** — technically possible but reimplements
  what Vercel Blob's own client-upload flow already does correctly, for no benefit.
- **Keep local dev/test on the same client-token pattern as production** — rejected: it would
  require a real Vercel Blob store/credentials to run locally or in CI, which is exactly what the
  local-filesystem driver (§2) was chosen specifically to avoid.

## 6. maplibre-gl's default build breaks under Next.js/Turbopack (found during polish)

**Decision**: Import maplibre-gl's "csp" build (`maplibre-gl/dist/maplibre-gl-csp`) instead of its
default entry point, paired with a real, statically-served worker script
(`public/maplibre-gl-csp-worker.js`, copied from `node_modules` at the installed version) rather
than the library's own default runtime-constructed Blob URL worker.

**Rationale**: This is a real bug found during T032's accessibility/browser verification, not a
hypothetical risk — the map rendered with zero tiles, borders, or labels visible (only the marker
pins), because a `ReferenceError` was thrown inside maplibre-gl's Web Worker the moment it tried to
construct one of its own internal error classes (used for tile-loading failures). The default build
assembles its worker from a runtime-generated Blob URL; that assembled script references a
native-class-extension helper (needed because the error classes `extend Error`) that never gets
inlined when the worker is built this way under Next.js/Turbopack specifically. maplibre-gl ships a
"csp" build precisely for environments where the default Blob-URL worker construction is
problematic (originally aimed at strict Content-Security-Policy setups, but the same alternate
loading path — a real file, not a runtime-assembled string — sidesteps this helper-injection issue
too). Confirmed fixed by checking for the `ReferenceError` in the browser console and by watching
real vector-tile (`.pbf`) and font-glyph network requests succeed after switching, then visually
confirming labeled landmasses/borders render (see plan.md's Constitution Check for the axe/
Lighthouse pass this was caught during).

Since the csp build ships no `.d.ts` of its own, `src/types/maplibre-gl-csp.d.ts` declares it as
`unknown`, cast to the main package's real types at the one call site that imports it
(`src/components/travel/travel-map.tsx`) — a documented third-party integration boundary
(constitution Principle I), not a general-purpose `any`.

**Alternatives considered**:
- **`transpilePackages: ["maplibre-gl"]`** — tried first, on the theory that running the *default*
  build through Next's own compiler (instead of treating it as opaque pre-built code) would inject
  the missing helper. It didn't fix the worker's own runtime-assembled script (that Blob URL is
  built by maplibre-gl's own code at runtime, entirely outside anything Turbopack processes at
  build time), so it was removed once the csp-build fix was confirmed sufficient on its own —
  keeping `next.config.js` at its minimum necessary configuration (Principle I).
- **Leaflet instead of MapLibre** — would have sidestepped this specific bug by avoiding
  MapLibre entirely, but re-opening research.md §1's already-consulted-on library choice over a
  packaging bug in one specific build artifact isn't proportionate — the fix here is small,
  documented, and doesn't touch the underlying library decision.

## 7. `/travel`'s Lighthouse Performance score (measured during polish)

**Measured**: `/travel` (the live interactive map) scored Performance 69/100 against a production
build — below the 78-91 range phases 1-4 established, and below constitution Principle VII's 95+
target. `/travel/list` (82/100) and `/travel/[id]` (87/100) — neither of which renders the live map
— both fall within that established range. Accessibility measured 100/100 on all three.

**Rationale for the gap (not a regression to chase down)**: Lighthouse attributes 92% of `/travel`'s
Largest Contentful Paint time to "Render Delay" (main-thread cost) rather than network/resource
loading — consistent with a real WebGL map (context creation, style/tile parsing, worker
communication) costing genuinely more main-thread time than any of Decision Journal's existing
pages, all of which are plain server-rendered content with minimal client-side JavaScript. This
compounds with the same measurement caveat phase 1's plan.md already documented: Lighthouse run
against a local production server sharing the same machine as the Chromium instance measuring it,
which phase 1 found produced TTFB numbers indistinguishable between static and dynamic pages — a
signature of resource contention, not real server latency. `/travel/list` and `/travel/[id]`
scoring within the established range confirms the app's own code isn't the general problem; the gap
is specific to the one page that does real WebGL work.

**Not addressed by**: a `<link rel="preconnect">` hint to the tile host — checked first, but ruled
out once the LCP breakdown showed 0% of the time in "Load Delay"/"Load Time" (the phases a
preconnect hint would improve); the entire measured gap is in main-thread render time, which
preconnecting a network origin doesn't touch.

**Alternatives considered**: Re-measuring against a real Vercel deployment (dedicated serverless
resources, real CDN edge delivery, no shared-machine contention) is the fairer test of this
principle's actual intent, per phase 1's own precedent — flagged as a follow-up once this ships,
not done now since no deployment exists yet to measure against.

## 8. Site-wide dark mode (found missing, then implemented, during polish)

**Decision**: Implement dark mode across the *entire* site — not just this feature. Three layers:
- **Manual toggle, class-based** (`theme-toggle.tsx`, next to the account/sign-in area in
  `nav-bar.tsx`): `globals.css` uses `@custom-variant dark (&:where(.dark, .dark *));` so every
  `dark:` utility responds to a `.dark` class on `<html>`, not the media query. A blocking inline
  script in `layout.tsx` (must run before first paint, not in a `useEffect`, or the wrong theme
  flashes) sets that class from a stored `localStorage` choice, falling back to
  `prefers-color-scheme` when the visitor hasn't chosen explicitly yet. The toggle shows the
  opposite icon of the current theme — a moon in light mode, a sun in dark mode — since that's what
  clicking it switches *to* (project owner's explicit request), not the current state.
- **Custom design tokens** (`globals.css`): a `:root.dark { ... }` block overrides only the tokens
  ever used as standalone text against the page's own background (`--color-brand-600`, the
  nav/link active-state color, lightened for dark-background contrast; two new chart-specific
  tokens, `--color-chart-grid`/`--color-chart-bar`, added specifically because Recharts renders raw
  SVG and Tailwind's `dark:` variant only rewrites class names, not SVG `stroke`/`fill` attributes —
  so the chart reads these CSS custom properties directly instead). `--color-brand-500`/`700` and
  every `status-*`/`verdict-*` token are left alone: they're always used as a self-contained
  text+background pair (a button, a status badge), so their internal contrast already holds
  regardless of the surrounding page's theme.
- **Generic backgrounds/text/borders** (`bg-white`, `text-gray-900`, `border-gray-300`, etc.):
  Tailwind's `dark:` variant, added per element across every existing page and component that used
  one (~26 files site-wide, not just this feature's new ones) — no central override was possible
  here since these are Tailwind's own built-in palette values, not custom tokens.

**Rationale**: This principle's text (added this amendment) requires dark mode site-wide, but
auditing the codebase during this feature's own polish pass (tasks.md T035) found no dark-mode
implementation anywhere on the site at all — not on Travel's new pages, not on any of Decision
Journal's existing ones. This is a pre-existing gap this feature didn't cause, but is the first
to actually run into. The project owner was asked directly (implement site-wide now vs. defer as
separate work) and chose to implement it now rather than ship Travel Photo Map as the one
light-mode-only feature launching after the gap was already known.

**Known, accepted limitation**: the map's own tiles/imagery (MapLibre + OpenFreeMap) don't re-theme
with the page — no dark map style was substituted. This matches how most map-based products behave
(a map usually keeps one visual style regardless of the surrounding app's theme); revisiting it
would mean sourcing a second, dark-appropriate tile style, which wasn't part of what was asked for
here.

**Alternatives considered**:
- **`prefers-color-scheme` only, no manual override** — the first version shipped; the project
  owner asked for a manual toggle immediately afterward, so this was superseded within the same
  polish pass rather than becoming a real alternative path.
- **A cookie instead of `localStorage`** for the stored choice — would let the *server* render the
  right theme on first load too (no blocking script needed), but adds a round-trip/middleware
  concern for a single visual preference on a personal portfolio site; `localStorage` plus a
  blocking script is the standard, simpler pattern for this exact problem.
- **Re-theme the map tiles too** — rejected for this pass per the "known, accepted limitation"
  above; would need a second tile style and a way to swap it based on the resolved color scheme.
