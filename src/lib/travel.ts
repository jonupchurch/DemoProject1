import "server-only";
import type { Pin, Photo } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCurrentUserId, getCurrentUserId } from "@/lib/session";
import { photoStorage } from "@/lib/photo-storage";
import {
  ACCEPTED_PHOTO_CONTENT_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  CreatePinInput,
  UpdatePinDetailsInput,
  UploadedPhoto,
} from "@/lib/travel-types";
import type { AcceptedPhotoContentType } from "@/lib/travel-types";

export { ACCEPTED_PHOTO_CONTENT_TYPES, MAX_PHOTO_SIZE_BYTES } from "@/lib/travel-types";
export type { CreatePinInput, UpdatePinDetailsInput, UploadedPhoto } from "@/lib/travel-types";

export type PinWithPhotos = Pin & { photos: Photo[] };

export class ValidationError extends Error {
  constructor(public fieldErrors: Record<string, string>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Pin not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** FR-004: both come only from the uploader's own map selection (constitution Principle IX). */
function validateCoordinates(
  latitude: number,
  longitude: number,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (
    typeof latitude !== "number" ||
    Number.isNaN(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    errors.latitude = "Latitude must be a number between -90 and 90.";
  }

  if (
    typeof longitude !== "number" ||
    Number.isNaN(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    errors.longitude = "Longitude must be a number between -180 and 180.";
  }

  return errors;
}

/**
 * research.md §3/§5: JPEG/PNG/WebP only, 10 MB max — enforced at upload time
 * (the two `/api/travel-photos/upload-*` routes), before a file ever becomes
 * an `UploadedPhoto` reference. Exported so both routes share one check
 * rather than duplicating it.
 */
export function validatePhotoFile(file: File): string | undefined {
  if (!ACCEPTED_PHOTO_CONTENT_TYPES.includes(file.type as AcceptedPhotoContentType)) {
    return "Photos must be JPEG, PNG, or WebP images.";
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return "Each photo must be 10 MB or smaller.";
  }
  return undefined;
}

/**
 * Pure validation, independent of the database — FR-001, FR-004, FR-010.
 * Only checks that at least one already-uploaded photo reference is present;
 * each file's own type/size was already validated at upload time
 * (`validatePhotoFile`, above), before `createPin` ever sees it.
 */
export function validateCreatePinInput(input: CreatePinInput): Record<string, string> {
  const errors = validateCoordinates(input.latitude, input.longitude);

  if (!input.photos || input.photos.length < 1) {
    errors.photos = "At least one photo is required.";
  }

  return errors;
}

/** Pure validation, independent of the database — FR-004. */
export function validateUpdatePinDetailsInput(
  input: UpdatePinDetailsInput,
): Record<string, string> {
  return validateCoordinates(input.latitude, input.longitude);
}

/**
 * FR-005: every published pin, publicly readable — no `requireCurrentUserId()` call.
 */
export async function listPins(): Promise<PinWithPhotos[]> {
  return prisma.pin.findMany({
    include: { photos: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

/** FR-005, FR-006: full detail for one pin, publicly readable. */
export async function getPin(id: string): Promise<PinWithPhotos | null> {
  return prisma.pin.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
}

/**
 * FR-012: used by the UI to decide whether to show edit/delete/photo-
 * management controls. Returns `false` for a signed-out visitor rather than
 * throwing — viewing is always allowed regardless of ownership.
 */
export async function isPinOwnedByCurrentUser(pin: Pin): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null && userId === pin.ownerId;
}

/**
 * Photos are already uploaded (research.md §5) by the time this runs — no
 * `PhotoStorage.put()` call here, just persisting the references.
 */
export async function createPin(input: CreatePinInput): Promise<PinWithPhotos> {
  const errors = validateCreatePinInput(input);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  const ownerId = await requireCurrentUserId();

  return prisma.pin.create({
    data: {
      ownerId,
      latitude: input.latitude,
      longitude: input.longitude,
      caption: input.caption,
      photos: {
        create: input.photos.map((photo, index) => ({
          url: photo.url,
          contentType: photo.contentType,
          sortOrder: index,
        })),
      },
    },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
}

/** FR-009, FR-011 (NON-NEGOTIABLE): edits only a pin's caption/location. */
export async function updatePinDetails(
  id: string,
  input: UpdatePinDetailsInput,
): Promise<Pin> {
  const errors = validateUpdatePinDetailsInput(input);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  const userId = await requireCurrentUserId();
  const pin = await prisma.pin.findUnique({ where: { id } });
  if (!pin) {
    throw new NotFoundError();
  }
  if (pin.ownerId !== userId) {
    throw new ForbiddenError();
  }

  return prisma.pin.update({
    where: { id },
    data: {
      latitude: input.latitude,
      longitude: input.longitude,
      caption: input.caption,
    },
  });
}

/** FR-009, FR-011 (NON-NEGOTIABLE): appends a photo to the end of the gallery. */
export async function addPhotoToPin(pinId: string, photo: UploadedPhoto): Promise<Photo> {
  const userId = await requireCurrentUserId();
  const pin = await prisma.pin.findUnique({
    where: { id: pinId },
    include: { photos: true },
  });
  if (!pin) {
    throw new NotFoundError();
  }
  if (pin.ownerId !== userId) {
    throw new ForbiddenError();
  }

  const nextSortOrder =
    pin.photos.length > 0 ? Math.max(...pin.photos.map((p) => p.sortOrder)) + 1 : 0;

  return prisma.photo.create({
    data: {
      pinId,
      url: photo.url,
      contentType: photo.contentType,
      sortOrder: nextSortOrder,
    },
  });
}

/**
 * FR-009, FR-010, FR-011 (NON-NEGOTIABLE): rejects removing a pin's only
 * remaining photo — deleting the whole pin is the way to do that instead.
 */
export async function removePhotoFromPin(photoId: string): Promise<void> {
  const userId = await requireCurrentUserId();
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { pin: { include: { photos: true } } },
  });
  if (!photo) {
    throw new NotFoundError("Photo not found.");
  }
  if (photo.pin.ownerId !== userId) {
    throw new ForbiddenError();
  }
  if (photo.pin.photos.length <= 1) {
    throw new ValidationError({
      _root: "A pin must always have at least one photo — delete the whole pin instead.",
    });
  }

  await photoStorage.delete(photo.url);
  await prisma.photo.delete({ where: { id: photoId } });
}

/** FR-009, FR-011 (NON-NEGOTIABLE): deletes a pin and every one of its photos. */
export async function deletePin(id: string): Promise<void> {
  const userId = await requireCurrentUserId();
  const pin = await prisma.pin.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!pin) {
    throw new NotFoundError();
  }
  if (pin.ownerId !== userId) {
    throw new ForbiddenError();
  }

  await Promise.all(pin.photos.map((photo) => photoStorage.delete(photo.url)));
  await prisma.pin.delete({ where: { id } });
}
