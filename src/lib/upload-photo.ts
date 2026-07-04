import type { UploadedPhoto } from "@/lib/travel-types";

/**
 * Uploads one photo file and returns a reference to it — never raw bytes —
 * for `createPin`/`addPhotoToPin` to persist (research.md §5). In production
 * this uploads directly from the browser to Vercel Blob via a short-lived
 * client token (bypassing Vercel's serverless-function request-body cap
 * entirely); in dev/test it posts to a same-origin route backed by the local
 * filesystem `PhotoStorage` driver instead, mirroring the same
 * `NODE_ENV === "production"` split `src/lib/photo-storage/index.ts` already
 * uses server-side.
 */
export async function uploadPhotoFile(file: File): Promise<UploadedPhoto> {
  if (process.env.NODE_ENV === "production") {
    const { upload } = await import("@vercel/blob/client");
    const blob = await upload(`travel-photos/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/travel-photos/upload-token",
      contentType: file.type,
    });
    return { url: blob.url, contentType: file.type };
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/travel-photos/upload-local", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Upload failed.");
  }

  const data = (await response.json()) as UploadedPhoto;
  return data;
}
