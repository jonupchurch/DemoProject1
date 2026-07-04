import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { validatePhotoFile } from "@/lib/travel";
import { localPhotoStorage } from "@/lib/photo-storage/local";

/**
 * Dev/test-only upload path (research.md §5) — production never calls this;
 * the client uploads straight to Vercel Blob instead via
 * `/api/travel-photos/upload-token`. Kept as a separate Route Handler
 * (not a Server Action) specifically because Route Handlers aren't subject
 * to Next's Server Action body-size default, and this never runs on Vercel's
 * infrastructure in practice, so its hard 4.5MB request-body cap never
 * applies here either.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production." },
      { status: 404 },
    );
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  // Not `instanceof File` — a File value round-tripped through
  // `Request`/`FormData` isn't guaranteed to share a realm with the
  // ambient global `File` (e.g. under a jsdom test environment). A
  // `FormDataEntryValue` is only ever `string | File`, so ruling out
  // `string` is sufficient to know this is a real file.
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const validationError = validatePhotoFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await localPhotoStorage.put(buffer, file.type);

  return NextResponse.json({ url, contentType: file.type });
}
