import Image from "next/image";
import type { Photo } from "@prisma/client";

export interface PinGalleryProps {
  photos: Photo[];
  caption?: string | null;
}

/**
 * `next/image` with responsive sizing and lazy-loading below the fold
 * (constitution Principle VII, expanded this amendment) — only the first
 * photo is `priority` (eager); every other photo lazy-loads by default.
 */
export function PinGallery({ photos, caption }: PinGalleryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="relative aspect-square overflow-hidden rounded-card bg-gray-100 dark:bg-gray-800"
        >
          <Image
            src={photo.url}
            alt={
              caption
                ? `${caption} — photo ${index + 1} of ${photos.length}`
                : `Travel photo ${index + 1} of ${photos.length}`
            }
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
