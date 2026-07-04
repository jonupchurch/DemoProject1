import "server-only";
import { localPhotoStorage } from "@/lib/photo-storage/local";
import { vercelBlobPhotoStorage } from "@/lib/photo-storage/vercel-blob";

export interface PhotoStorage {
  put(file: Buffer, contentType: string): Promise<{ url: string }>;
  delete(url: string): Promise<void>;
}

/**
 * Vercel Blob in production; the local filesystem everywhere else (dev/test),
 * so neither running the app locally nor running the test suite needs a
 * cloud storage account (research.md §2).
 */
export const photoStorage: PhotoStorage =
  process.env.NODE_ENV === "production" ? vercelBlobPhotoStorage : localPhotoStorage;
