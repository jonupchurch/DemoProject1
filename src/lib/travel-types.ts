// Client-safe: no server-only/Prisma import here. Client Components (e.g.
// pin-form.tsx) must import from this module, never from src/lib/travel.ts,
// which pulls in the Prisma client / `pg` driver.

export const ACCEPTED_PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedPhotoContentType = (typeof ACCEPTED_PHOTO_CONTENT_TYPES)[number];

/** research.md §3 */
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * A photo that has already been uploaded to storage (research.md §5) — the
 * client uploads each file itself (directly to Vercel Blob in production via
 * `@vercel/blob/client`, or to a same-origin route in dev/test) before ever
 * calling `createPin`/`addPhotoToPin`, so those Server Actions never receive
 * raw file bytes and are never subject to Vercel's serverless-function
 * request-body cap.
 */
export interface UploadedPhoto {
  url: string;
  contentType: string;
}

export interface CreatePinInput {
  latitude: number;
  longitude: number;
  caption?: string;
  photos: UploadedPhoto[]; // length >= 1 (FR-001, FR-010)
}

export interface UpdatePinDetailsInput {
  latitude: number;
  longitude: number;
  caption?: string;
}
