"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PinMarkerPopup } from "@/components/travel/pin-marker-popup";
import type { PinWithPhotos } from "@/lib/travel";

const TravelMap = dynamic(
  () => import("@/components/travel/travel-map").then((mod) => mod.TravelMap),
  { ssr: false },
);

export function TravelBrowse({ pins }: { pins: PinWithPhotos[] }) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const selectedPin = pins.find((pin) => pin.id === selectedPinId) ?? null;

  if (pins.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No pins published yet.</p>;
  }

  return (
    <div className="relative">
      <TravelMap
        pins={pins.map((pin) => ({
          id: pin.id,
          latitude: pin.latitude,
          longitude: pin.longitude,
        }))}
        onMarkerClick={setSelectedPinId}
      />
      {selectedPin && (
        <PinMarkerPopup pin={selectedPin} onClose={() => setSelectedPinId(null)} />
      )}
    </div>
  );
}
