import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PhotoStorage } from "@/lib/photo-storage";

// Dev/test only (research.md §2) — gitignored, never committed or deployed.
export const LOCAL_PHOTO_STORAGE_DIR = path.join(process.cwd(), ".data", "photo-storage");

export const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Served back through `src/app/api/travel-photos/[filename]/route.ts` rather
 * than `public/` — dev/test uploads should never need `public/` cleanup or
 * risk being committed.
 */
export const localPhotoStorage: PhotoStorage = {
  async put(file, contentType) {
    await mkdir(LOCAL_PHOTO_STORAGE_DIR, { recursive: true });
    const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? "bin";
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(path.join(LOCAL_PHOTO_STORAGE_DIR, filename), file);
    return { url: `/api/travel-photos/${filename}` };
  },

  async delete(url) {
    const filename = url.split("/").pop();
    if (!filename) return;
    await unlink(path.join(LOCAL_PHOTO_STORAGE_DIR, filename)).catch(() => {});
  },
};
