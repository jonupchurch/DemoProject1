import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createPin,
  updatePinDetails,
  addPhotoToPin,
  removePhotoFromPin,
  deletePin,
} from "@/actions/travel";
import { getPin, listPins } from "@/lib/travel";
import { prisma } from "@/lib/db";
import { ensureTestUser, mockSessionAs, resetPins } from "./setup";

function makeUploadedPhoto(index = 0) {
  return { url: `/api/travel-photos/test-${index}.jpg`, contentType: "image/jpeg" };
}

// Authentication itself (no session -> rejected) is already covered by
// tests/unit/session.test.ts's requireCurrentUserId() coverage, reused
// unmodified here — matching how tests/integration/decisions-actions.test.ts
// and auth-access.test.ts never re-test the null-session path either.
beforeAll(async () => {
  const user = await ensureTestUser();
  mockSessionAs(user.id);
});

afterEach(async () => {
  await resetPins();
});

describe("createPin (Server Action)", () => {
  it("persists a valid pin with its photo(s)", async () => {
    const result = await createPin({
      latitude: 40.7128,
      longitude: -74.006,
      caption: "A test pin",
      photos: [makeUploadedPhoto()],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.latitude).toBe(40.7128);
    expect(result.data.longitude).toBe(-74.006);
    expect(result.data.caption).toBe("A test pin");
    expect(result.data.photos).toHaveLength(1);

    const stored = await prisma.pin.findUnique({
      where: { id: result.data.id },
      include: { photos: true },
    });
    expect(stored?.photos).toHaveLength(1);
  });

  it("persists every photo in a multi-photo gallery, in order", async () => {
    const result = await createPin({
      latitude: 0,
      longitude: 0,
      photos: [makeUploadedPhoto(0), makeUploadedPhoto(1), makeUploadedPhoto(2)],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.photos).toHaveLength(3);
    expect(result.data.photos.map((p) => p.sortOrder)).toEqual([0, 1, 2]);
  });

  it("rejects out-of-range coordinates and persists nothing", async () => {
    const result = await createPin({
      latitude: 999,
      longitude: 0,
      photos: [makeUploadedPhoto()],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.latitude).toBeDefined();
    expect(await prisma.pin.count()).toBe(0);
  });

  it("rejects an empty photos array and persists nothing", async () => {
    const result = await createPin({ latitude: 0, longitude: 0, photos: [] });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.photos).toBeDefined();
    expect(await prisma.pin.count()).toBe(0);
  });
});

describe("listPins / getPin (public reads, FR-005)", () => {
  it("returns every published pin with its photo gallery in order, with no session at all", async () => {
    const created = await createPin({
      latitude: 1,
      longitude: 2,
      photos: [makeUploadedPhoto(0), makeUploadedPhoto(1)],
    });
    if (!created.success) throw new Error("fixture failed");

    mockSessionAs(null);
    try {
      const pins = await listPins();
      expect(pins).toHaveLength(1);
      expect(pins[0].photos.map((p) => p.sortOrder)).toEqual([0, 1]);

      const pin = await getPin(created.data.id);
      expect(pin?.id).toBe(created.data.id);
      expect(pin?.photos).toHaveLength(2);
    } finally {
      mockSessionAs((await ensureTestUser()).id);
    }
  });

  it("returns null from getPin for a pin that doesn't exist", async () => {
    expect(await getPin("00000000-0000-0000-0000-000000000000")).toBeNull();
  });
});

describe("Managing your own pins (spec.md US3)", () => {
  let ownerId: string;
  let otherId: string;

  beforeAll(async () => {
    ownerId = (await ensureTestUser("travel-owner@example.com")).id;
    otherId = (await ensureTestUser("travel-other@example.com")).id;
  });

  async function createFixturePin(photoCount = 2) {
    mockSessionAs(ownerId);
    const result = await createPin({
      latitude: 10,
      longitude: 20,
      caption: "Original caption",
      photos: Array.from({ length: photoCount }, (_, i) => makeUploadedPhoto(i)),
    });
    if (!result.success) throw new Error("fixture failed");
    return result.data;
  }

  it("lets the owner update a pin's caption/location", async () => {
    const pin = await createFixturePin();
    mockSessionAs(ownerId);

    const result = await updatePinDetails(pin.id, {
      latitude: 45,
      longitude: -99,
      caption: "Updated caption",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.latitude).toBe(45);
    expect(result.data.caption).toBe("Updated caption");
  });

  it("rejects a different account's attempt to update a pin's details", async () => {
    const pin = await createFixturePin();
    mockSessionAs(otherId);

    const result = await updatePinDetails(pin.id, { latitude: 1, longitude: 1 });

    expect(result.success).toBe(false);
    const stillOriginal = await getPin(pin.id);
    expect(stillOriginal?.latitude).toBe(10);
  });

  it("lets the owner add a photo to the gallery, appended in order", async () => {
    const pin = await createFixturePin(1);
    mockSessionAs(ownerId);

    const result = await addPhotoToPin(pin.id, makeUploadedPhoto(9));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sortOrder).toBe(1);

    const updated = await getPin(pin.id);
    expect(updated?.photos).toHaveLength(2);
  });

  it("rejects a different account's attempt to add a photo", async () => {
    const pin = await createFixturePin(1);
    mockSessionAs(otherId);

    const result = await addPhotoToPin(pin.id, makeUploadedPhoto(9));

    expect(result.success).toBe(false);
    const stillOriginal = await getPin(pin.id);
    expect(stillOriginal?.photos).toHaveLength(1);
  });

  it("lets the owner remove a photo, leaving at least one", async () => {
    const pin = await createFixturePin(2);
    mockSessionAs(ownerId);

    const photoId = pin.photos[0].id;
    const result = await removePhotoFromPin(photoId, pin.id);

    expect(result.success).toBe(true);
    const updated = await getPin(pin.id);
    expect(updated?.photos).toHaveLength(1);
  });

  it("rejects removing a pin's only remaining photo (FR-010)", async () => {
    const pin = await createFixturePin(1);
    mockSessionAs(ownerId);

    const result = await removePhotoFromPin(pin.photos[0].id, pin.id);

    expect(result.success).toBe(false);
    const updated = await getPin(pin.id);
    expect(updated?.photos).toHaveLength(1);
  });

  it("rejects a different account's attempt to remove a photo", async () => {
    const pin = await createFixturePin(2);
    mockSessionAs(otherId);

    const result = await removePhotoFromPin(pin.photos[0].id, pin.id);

    expect(result.success).toBe(false);
    const updated = await getPin(pin.id);
    expect(updated?.photos).toHaveLength(2);
  });

  it("lets the owner delete a pin entirely, along with its photos", async () => {
    const pin = await createFixturePin();
    mockSessionAs(ownerId);

    const result = await deletePin(pin.id);

    expect(result.success).toBe(true);
    expect(await getPin(pin.id)).toBeNull();
    expect(await prisma.photo.count({ where: { pinId: pin.id } })).toBe(0);
  });

  it("rejects a different account's attempt to delete a pin", async () => {
    const pin = await createFixturePin();
    mockSessionAs(otherId);

    const result = await deletePin(pin.id);

    expect(result.success).toBe(false);
    expect(await getPin(pin.id)).not.toBeNull();
  });
});
