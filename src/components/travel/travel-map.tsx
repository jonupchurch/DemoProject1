"use client";

import { useEffect, useRef } from "react";
// maplibre-gl's default build constructs its Web Worker from a runtime Blob
// URL, which throws `ReferenceError: b is not defined` inside that worker
// under Next.js/Turbopack (the worker bundle references a native-class-
// extension helper — used by maplibre-gl's own internal tile-loading error
// classes — that never gets inlined when the worker is assembled at runtime
// rather than bundled normally). The "csp" build instead loads a real,
// statically-served worker script (public/maplibre-gl-csp-worker.js,
// copied from node_modules at the installed version) — maplibre-gl's own
// documented fix for exactly this class of bundler incompatibility. It ships
// with no `.d.ts` of its own, so types come from the main package instead
// (a documented third-party integration boundary, constitution Principle I).
import CspMapLibre from "maplibre-gl/dist/maplibre-gl-csp";
import type MapLibreGLTypes from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const maplibregl = CspMapLibre as unknown as typeof MapLibreGLTypes;
maplibregl.setWorkerUrl("/maplibre-gl-csp-worker.js");

// Free, keyless vector tiles (research.md §1) — no account/billing needed.
// "positron" (vs. "liberty"/"bright") is OpenFreeMap's light, minimalist
// style specifically meant to keep administrative/political borders legible.
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export interface TravelMapLocation {
  latitude: number;
  longitude: number;
}

export interface TravelMapPin extends TravelMapLocation {
  id: string;
}

export interface TravelMapProps {
  /** Publish flow (US1): clicking the map reports the chosen point. */
  pickable?: boolean;
  pickedLocation?: TravelMapLocation | null;
  onPick?: (location: TravelMapLocation) => void;
  /** Browse flow (US2): renders one marker per published pin. */
  pins?: TravelMapPin[];
  onMarkerClick?: (pinId: string) => void;
}

/**
 * A thin wrapper around `maplibre-gl` (research.md §1) — reads `window`/
 * `document` and paints to a canvas at import time, so callers MUST render
 * this via `next/dynamic` with `ssr: false` (plan.md Constraints).
 */
export function TravelMap({
  pickable,
  pickedLocation,
  onPick,
  pins,
  onMarkerClick,
}: TravelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pickMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pinMarkersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1.5,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickable || !onPick) return;

    function handleClick(event: maplibregl.MapMouseEvent) {
      onPick?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [pickable, onPick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    pickMarkerRef.current?.remove();
    pickMarkerRef.current = null;

    if (pickedLocation) {
      pickMarkerRef.current = new maplibregl.Marker({ color: "#4f46e5" })
        .setLngLat([pickedLocation.longitude, pickedLocation.latitude])
        .addTo(map);
    }
  }, [pickedLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    pinMarkersRef.current.forEach((marker) => marker.remove());
    pinMarkersRef.current = (pins ?? []).map((pin) => {
      const marker = new maplibregl.Marker({ color: "#0f766e" })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);
      marker.getElement().addEventListener("click", () => onMarkerClick?.(pin.id));
      return marker;
    });

    return () => {
      pinMarkersRef.current.forEach((marker) => marker.remove());
      pinMarkersRef.current = [];
    };
  }, [pins, onMarkerClick]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={pickable ? "Choose a location on the map" : "Map of published pins"}
      className="h-96 w-full rounded-card"
    />
  );
}
