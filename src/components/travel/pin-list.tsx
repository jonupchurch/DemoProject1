import Link from "next/link";
import type { PinWithPhotos } from "@/lib/travel";

/**
 * Plain semantic HTML (`<ul>`/`<li>`, real links) — the non-map, fully
 * keyboard/screen-reader-operable alternative for browsing pins (FR-008,
 * constitution Principle IV; research.md §4).
 */
export function PinList({ pins }: { pins: PinWithPhotos[] }) {
  if (pins.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No pins published yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {pins.map((pin) => (
        <li key={pin.id} className="rounded-card border border-gray-300 p-4 dark:border-gray-700">
          <Link href={`/travel/${pin.id}`} className="font-medium text-brand-600 underline">
            {pin.caption || "Untitled pin"}
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)} — {pin.photos.length} photo
            {pin.photos.length === 1 ? "" : "s"}
          </p>
        </li>
      ))}
    </ul>
  );
}
