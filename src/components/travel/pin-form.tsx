"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  createPin,
  updatePinDetails,
  addPhotoToPin,
  removePhotoFromPin,
  deletePin,
} from "@/actions/travel";
import { uploadPhotoFile } from "@/lib/upload-photo";
import type { TravelMapLocation } from "@/components/travel/travel-map";
import type { PinWithPhotos } from "@/lib/travel";

const TravelMap = dynamic(
  () => import("@/components/travel/travel-map").then((mod) => mod.TravelMap),
  { ssr: false },
);

export interface PinFormProps {
  mode?: "create" | "edit";
  /** Required when `mode` is `"edit"`. */
  pin?: PinWithPhotos;
}

export function PinForm({ mode = "create", pin }: PinFormProps) {
  const router = useRouter();
  const [location, setLocation] = useState<TravelMapLocation | null>(
    pin ? { latitude: pin.latitude, longitude: pin.longitude } : null,
  );
  const [caption, setCaption] = useState(pin?.caption ?? "");
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState(pin?.photos ?? []);
  // Editing doesn't need the disclosure again — the pin is already public.
  const [acknowledged, setAcknowledged] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!location) {
      setErrors({ latitude: "Choose a point on the map first." });
      return;
    }
    if (mode === "create" && newPhotos.length < 1) {
      setErrors({ photos: "At least one photo is required." });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    if (mode === "create") {
      let uploadedPhotos;
      try {
        uploadedPhotos = await Promise.all(newPhotos.map(uploadPhotoFile));
      } catch (error) {
        setIsSubmitting(false);
        setErrors({ photos: error instanceof Error ? error.message : "Upload failed." });
        return;
      }

      const result = await createPin({
        latitude: location.latitude,
        longitude: location.longitude,
        caption: caption || undefined,
        photos: uploadedPhotos,
      });

      setIsSubmitting(false);
      if (!result.success) {
        setErrors(result.errors);
        return;
      }
      router.push(`/travel/${result.data.id}`);
      return;
    }

    // Edit mode
    if (!pin) return;

    const detailsResult = await updatePinDetails(pin.id, {
      latitude: location.latitude,
      longitude: location.longitude,
      caption: caption || undefined,
    });
    if (!detailsResult.success) {
      setIsSubmitting(false);
      setErrors(detailsResult.errors);
      return;
    }

    for (const file of newPhotos) {
      try {
        const uploaded = await uploadPhotoFile(file);
        await addPhotoToPin(pin.id, uploaded);
      } catch (error) {
        setIsSubmitting(false);
        setErrors({ photos: error instanceof Error ? error.message : "Upload failed." });
        return;
      }
    }

    setIsSubmitting(false);
    router.push(`/travel/${pin.id}`);
    router.refresh();
  }

  async function handleRemoveExistingPhoto(photoId: string) {
    if (!pin) return;
    setErrors({});
    const result = await removePhotoFromPin(photoId, pin.id);
    if (!result.success) {
      setErrors({ photos: result.errors._root ?? "That photo couldn't be removed." });
      return;
    }
    setExistingPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  }

  async function handleDeletePin() {
    if (!pin) return;
    if (!window.confirm("Delete this pin and all of its photos? This cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    const result = await deletePin(pin.id);
    if (!result.success) {
      setIsDeleting(false);
      setErrors({ _root: result.errors._root ?? "This pin couldn't be deleted." });
      return;
    }
    router.push("/travel/list");
  }

  const canSubmit =
    location !== null &&
    (mode === "edit" || newPhotos.length > 0) &&
    acknowledged &&
    !isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {errors._root && <p className="text-sm text-verdict-wrong">{errors._root}</p>}

      <div className="flex flex-col gap-1">
        <span className="font-medium">Choose a location</span>
        <TravelMap pickable pickedLocation={location} onPick={setLocation} />
        {errors.latitude && <p className="text-sm text-verdict-wrong">{errors.latitude}</p>}
        {errors.longitude && <p className="text-sm text-verdict-wrong">{errors.longitude}</p>}
      </div>

      {mode === "edit" && existingPhotos.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-medium">Current photos</span>
          <ul className="flex flex-wrap gap-3">
            {existingPhotos.map((photo) => (
              <li key={photo.id} className="flex items-center gap-2 rounded-card border border-gray-300 px-3 py-2 text-sm dark:border-gray-700">
                <span className="max-w-40 truncate">{photo.url.split("/").pop()}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveExistingPhoto(photo.id)}
                  disabled={existingPhotos.length <= 1}
                  aria-label="Remove this photo"
                  className="text-verdict-wrong disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    existingPhotos.length <= 1
                      ? "A pin must always have at least one photo"
                      : "Remove this photo"
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="photos" className="font-medium">
          {mode === "edit" ? "Add more photos (optional)" : "Photos"}
        </label>
        <input
          id="photos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setNewPhotos(Array.from(e.target.files ?? []))}
          aria-invalid={Boolean(errors.photos)}
        />
        {errors.photos && <p className="text-sm text-verdict-wrong">{errors.photos}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="caption" className="font-medium">
          Caption (optional)
        </label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {mode === "create" && (
        <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1"
          />
          This pin&apos;s location and photos will be publicly visible to anyone, signed in or
          not.
        </label>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="self-start rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {mode === "edit"
            ? isSubmitting
              ? "Saving..."
              : "Save changes"
            : isSubmitting
              ? "Publishing..."
              : "Publish pin"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDeletePin}
            disabled={isDeleting}
            className="self-start rounded-card border border-verdict-wrong px-4 py-2 text-sm font-medium text-verdict-wrong hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete pin"}
          </button>
        )}
      </div>
    </form>
  );
}
