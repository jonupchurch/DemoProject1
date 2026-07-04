// No .d.ts is shipped for this subpath (research.md §1 addendum) — the
// runtime shape is identical to the main "maplibre-gl" export, cast to that
// package's real types at the one call site that imports this
// (src/components/travel/travel-map.tsx).
declare module "maplibre-gl/dist/maplibre-gl-csp" {
  const value: unknown;
  export default value;
}
