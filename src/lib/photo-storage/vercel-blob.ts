import "server-only";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import type { PhotoStorage } from "@/lib/photo-storage";
import { EXTENSION_BY_CONTENT_TYPE } from "@/lib/photo-storage/local";

// Production only (research.md §2) — native to the already-fixed Vercel
// deployment target, no separate cloud vendor account needed.
export const vercelBlobPhotoStorage: PhotoStorage = {
  async put(file, contentType) {
    const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? "bin";
    const pathname = `travel-photos/${randomUUID()}.${extension}`;
    const blob = await put(pathname, file, { access: "public", contentType });
    return { url: blob.url };
  },

  async delete(url) {
    await del(url);
  },
};
