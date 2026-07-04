import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { ACCEPTED_PHOTO_CONTENT_TYPES, MAX_PHOTO_SIZE_BYTES } from "@/lib/travel-types";

/**
 * Production upload path (research.md §5): issues a short-lived, scoped
 * client token so the browser can upload a photo directly to Vercel Blob —
 * the file bytes never pass through this or any other server route, which is
 * what avoids Vercel's hard 4.5MB serverless-function request-body cap
 * entirely (Server Actions and Route Handlers are both subject to it once
 * actually deployed there; a client-token upload isn't, since Vercel's own
 * edge infrastructure receives the bytes directly).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Next's request-scoped context (cookies/session) is still active
        // here even though `request` itself isn't passed to this callback.
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error("Authentication required.");
        }

        return {
          allowedContentTypes: [...ACCEPTED_PHOTO_CONTENT_TYPES],
          maximumSizeInBytes: MAX_PHOTO_SIZE_BYTES,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
