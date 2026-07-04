import { describe, expect, it } from "vitest";
import {
  MAX_PHOTO_SIZE_BYTES,
  validateCreatePinInput,
  validatePhotoFile,
  validateUpdatePinDetailsInput,
  type CreatePinInput,
} from "@/lib/travel";

function makeUploadedPhoto() {
  return { url: "/api/travel-photos/test.jpg", contentType: "image/jpeg" };
}

function makePhotoFile(overrides: { type?: string; size?: number } = {}): File {
  const file = new File([new Uint8Array(10)], "photo.jpg", {
    type: overrides.type ?? "image/jpeg",
  });
  if (overrides.size !== undefined) {
    Object.defineProperty(file, "size", { value: overrides.size });
  }
  return file;
}

function validInput(overrides: Partial<CreatePinInput> = {}): CreatePinInput {
  return {
    latitude: 40.7128,
    longitude: -74.006,
    photos: [makeUploadedPhoto()],
    ...overrides,
  };
}

describe("validateCreatePinInput", () => {
  it("accepts a fully valid input", () => {
    expect(validateCreatePinInput(validInput())).toEqual({});
  });

  it.each([
    [-90, -180],
    [90, 180],
    [0, 0],
  ])("accepts boundary coordinates (%s, %s)", (latitude, longitude) => {
    const errors = validateCreatePinInput(validInput({ latitude, longitude }));
    expect(errors.latitude).toBeUndefined();
    expect(errors.longitude).toBeUndefined();
  });

  it.each([-91, 91, Number.NaN])("rejects an out-of-range latitude %s", (latitude) => {
    const errors = validateCreatePinInput(validInput({ latitude }));
    expect(errors.latitude).toBeDefined();
  });

  it.each([-181, 181, Number.NaN])("rejects an out-of-range longitude %s", (longitude) => {
    const errors = validateCreatePinInput(validInput({ longitude }));
    expect(errors.longitude).toBeDefined();
  });

  it("requires at least one photo", () => {
    const errors = validateCreatePinInput(validInput({ photos: [] }));
    expect(errors.photos).toBeDefined();
  });

  it("accepts a multi-photo gallery", () => {
    const errors = validateCreatePinInput(
      validInput({ photos: [makeUploadedPhoto(), makeUploadedPhoto()] }),
    );
    expect(errors.photos).toBeUndefined();
  });
});

describe("validateUpdatePinDetailsInput", () => {
  it("accepts a fully valid input", () => {
    expect(
      validateUpdatePinDetailsInput({ latitude: 10, longitude: 10 }),
    ).toEqual({});
  });

  it.each([-91, 91])("rejects an out-of-range latitude %s", (latitude) => {
    const errors = validateUpdatePinDetailsInput({ latitude, longitude: 0 });
    expect(errors.latitude).toBeDefined();
  });

  it.each([-181, 181])("rejects an out-of-range longitude %s", (longitude) => {
    const errors = validateUpdatePinDetailsInput({ latitude: 0, longitude });
    expect(errors.longitude).toBeDefined();
  });
});

describe("validatePhotoFile", () => {
  it("accepts an accepted photo content type with no error", () => {
    expect(validatePhotoFile(makePhotoFile())).toBeUndefined();
  });

  it.each(["image/jpeg", "image/png", "image/webp"])(
    "accepts content type %s",
    (type) => {
      expect(validatePhotoFile(makePhotoFile({ type }))).toBeUndefined();
    },
  );

  it.each(["image/gif", "application/pdf", "text/plain"])(
    "rejects unaccepted content type %s",
    (type) => {
      expect(validatePhotoFile(makePhotoFile({ type }))).toBeDefined();
    },
  );

  it("accepts a file at exactly the size limit", () => {
    expect(
      validatePhotoFile(makePhotoFile({ size: MAX_PHOTO_SIZE_BYTES })),
    ).toBeUndefined();
  });

  it("rejects a file exceeding the size limit", () => {
    expect(
      validatePhotoFile(makePhotoFile({ size: MAX_PHOTO_SIZE_BYTES + 1 })),
    ).toBeDefined();
  });
});
