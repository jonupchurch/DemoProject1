import Image from "next/image";
import Link from "next/link";
import type { PinWithPhotos } from "@/lib/travel";

export interface PinMarkerPopupProps {
  pin: PinWithPhotos;
  onClose: () => void;
}

/** Shown over the map when a marker is clicked (US2) — a cover-photo preview
 * plus a link to the pin's full gallery, not a re-implementation of it. */
export function PinMarkerPopup({ pin, onClose }: PinMarkerPopupProps) {
  const coverPhoto = pin.photos[0];

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-4 rounded-card border border-gray-300 bg-white p-4 shadow-lg sm:right-auto sm:w-80 dark:border-gray-700 dark:bg-gray-800">
      {coverPhoto && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-card bg-gray-100 dark:bg-gray-700">
          <Image
            src={coverPhoto.url}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        {pin.caption && <p className="truncate font-medium">{pin.caption}</p>}
        <Link href={`/travel/${pin.id}`} className="text-sm text-brand-600 underline">
          View full gallery
        </Link>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="shrink-0 text-lg leading-none text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        &times;
      </button>
    </div>
  );
}
