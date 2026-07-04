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
