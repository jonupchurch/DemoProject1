import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { LOCAL_PHOTO_STORAGE_DIR } from "@/lib/photo-storage/local";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Serves photos written by the local-filesystem PhotoStorage driver
 * (dev/test only, research.md §2) — production serves photos directly from
 * Vercel Blob's own public URL instead, never through this route.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (filename.includes("/") || filename.includes("..")) {
    return new NextResponse(null, { status: 400 });
  }

  const extension = filename.split(".").pop() ?? "";
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const data = await readFile(path.join(LOCAL_PHOTO_STORAGE_DIR, filename));
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
