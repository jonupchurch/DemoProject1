import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { POST as uploadLocal } from "@/app/api/travel-photos/upload-local/route";
import { ensureTestUser, mockSessionAs, resetPins } from "./setup";

function makeUploadRequest(file: File | null): Request {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return new Request("http://localhost/api/travel-photos/upload-local", {
    method: "POST",
    body: formData,
  });
}

// Actual byte length, not a spoofed `.size` property — this file goes
// through a real multipart Request/FormData round-trip, which normalizes
// `.size` back to the true content length either way.
function makePhotoFile(overrides: { type?: string; size?: number } = {}): File {
  return new File([new Uint8Array(overrides.size ?? 10)], "photo.jpg", {
    type: overrides.type ?? "image/jpeg",
  });
}

beforeAll(async () => {
  const user = await ensureTestUser();
  mockSessionAs(user.id);
});

afterEach(async () => {
  await resetPins();
});

describe("POST /api/travel-photos/upload-local (dev/test PhotoStorage driver, research.md §5)", () => {
  it("accepts a valid photo and returns its stored URL", async () => {
    const response = await uploadLocal(makeUploadRequest(makePhotoFile()));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.url).toMatch(/^\/api\/travel-photos\//);
    expect(body.contentType).toBe("image/jpeg");
  });

  it("rejects an unaccepted content type", async () => {
    const response = await uploadLocal(
      makeUploadRequest(makePhotoFile({ type: "image/gif" })),
    );
    expect(response.status).toBe(400);
  });

  // The size-limit rejection itself is unit-tested directly against
  // validatePhotoFile() in tests/unit/travel.test.ts, on a real in-realm
  // File object. It isn't re-tested at this route level: jsdom's File/Blob
  // implementation doesn't round-trip real binary content correctly through
  // Node's native Request/FormData here (an environment-only artifact —
  // actual production Route Handlers run in plain Node with one consistent
  // File implementation), so simulating an 11MB upload through this test's
  // Request/FormData construction can't reliably exercise that path.

  it("rejects a request with no file", async () => {
    const response = await uploadLocal(makeUploadRequest(null));
    expect(response.status).toBe(400);
  });

  it("rejects an unauthenticated request", async () => {
    mockSessionAs(null);
    const response = await uploadLocal(makeUploadRequest(makePhotoFile()));
    expect(response.status).toBe(401);
    mockSessionAs((await ensureTestUser()).id);
  });
});
