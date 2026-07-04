"use server";

import { revalidatePath } from "next/cache";
import {
  createPin as createPinRecord,
  updatePinDetails as updatePinDetailsRecord,
  addPhotoToPin as addPhotoToPinRecord,
  removePhotoFromPin as removePhotoFromPinRecord,
  deletePin as deletePinRecord,
  CreatePinInput,
  UpdatePinDetailsInput,
  UploadedPhoto,
  PinWithPhotos,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@/lib/travel";
import type { Pin, Photo } from "@prisma/client";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

function revalidateTravel(pinId?: string) {
  revalidatePath("/travel");
  revalidatePath("/travel/list");
  if (pinId) {
    revalidatePath(`/travel/${pinId}`);
    revalidatePath(`/travel/${pinId}/edit`);
  }
}

export async function createPin(
  input: CreatePinInput,
): Promise<ActionResult<PinWithPhotos>> {
  try {
    const pin = await createPinRecord(input);
    revalidateTravel();
    return { success: true, data: pin };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    throw error;
  }
}

export async function updatePinDetails(
  id: string,
  input: UpdatePinDetailsInput,
): Promise<ActionResult<Pin>> {
  try {
    const pin = await updatePinDetailsRecord(id, input);
    revalidateTravel(id);
    return { success: true, data: pin };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return { success: false, errors: { _root: error.message } };
    }
    throw error;
  }
}

export async function addPhotoToPin(
  pinId: string,
  photo: UploadedPhoto,
): Promise<ActionResult<Photo>> {
  try {
    const created = await addPhotoToPinRecord(pinId, photo);
    revalidateTravel(pinId);
    return { success: true, data: created };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return { success: false, errors: { _root: error.message } };
    }
    throw error;
  }
}

export async function removePhotoFromPin(
  photoId: string,
  pinId: string,
): Promise<ActionResult<null>> {
  try {
    await removePhotoFromPinRecord(photoId);
    revalidateTravel(pinId);
    return { success: true, data: null };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return { success: false, errors: { _root: error.message } };
    }
    throw error;
  }
}

export async function deletePin(id: string): Promise<ActionResult<null>> {
  try {
    await deletePinRecord(id);
    revalidateTravel();
    return { success: true, data: null };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return { success: false, errors: { _root: error.message } };
    }
    throw error;
  }
}
