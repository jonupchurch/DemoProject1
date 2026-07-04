# Phase 1 Contracts: Server Actions

Same internal-contract approach as `specs/001-decision-log-revisit/contracts/server-actions.md` —
no external API consumers exist for this app either, so this documents the function signatures
`src/actions/travel.ts` exposes to the UI layer.

Every mutating action reads the current session's user id itself (via the existing
`requireCurrentUserId()`, `src/lib/session.ts`) — none accept an `ownerId`/`pinId`-owner parameter
from the client, so a caller cannot claim ownership of someone else's pin by passing a different id
(constitution Principle VIII).

## `createPin(input: CreatePinInput): Promise<PinWithPhotos>`

```text
CreatePinInput = {
  latitude: number    // -90 to 90 (FR-004)
  longitude: number   // -180 to 180 (FR-004)
  caption?: string
  photos: File[]      // length >= 1 (FR-001, FR-010)
}
```

- Requires an authenticated session; rejects otherwise (FR-002).
- Rejects with a field-level validation error if `latitude`/`longitude` are missing/out of range,
  or `photos` is empty (FR-001, FR-004).
- Rejects if any file in `photos` isn't an accepted image type or exceeds the size limit (FR-013,
  research.md §3) — no partial pin is created if any photo fails validation.
- On success: uploads each valid photo via `PhotoStorage.put()` (research.md §2), persists a `Pin`
  owned by the current session's user together with its `Photo` rows, and returns it with photos
  attached in upload order.

## `updatePinDetails(id: string, input: UpdatePinDetailsInput): Promise<Pin>`

```text
UpdatePinDetailsInput = {
  latitude: number
  longitude: number
  caption?: string
}
```

- Rejects unless the current session's user owns the target `Pin` (FR-009, FR-011, NON-NEGOTIABLE).
- Updates only location/caption — does not touch the photo gallery (see below).

## `addPhotoToPin(pinId: string, photo: File): Promise<Photo>`

- Rejects unless the current session's user owns the target `Pin`.
- Rejects if `photo` isn't an accepted image type or exceeds the size limit (same validation as
  `createPin`).
- On success: uploads the file via `PhotoStorage.put()`, persists a new `Photo` row appended to the
  end of the pin's gallery order (FR-009).

## `removePhotoFromPin(photoId: string): Promise<void>`

- Rejects unless the current session's user owns the `Pin` that `photoId` belongs to.
- Rejects if this is the target `Pin`'s only remaining `Photo` (FR-010, edge case) — deleting the
  whole pin is the way to remove a last photo.
- On success: deletes the storage object via `PhotoStorage.delete()` and the `Photo` row.

## `deletePin(id: string): Promise<void>`

- Rejects unless the current session's user owns the target `Pin`.
- Deletes every one of the pin's photos from storage (`PhotoStorage.delete()` for each), then the
  `Pin` row (cascading its `Photo` rows) (FR-009 acceptance scenario 3).
- The UI is responsible for confirming with the user before calling this action, consistent with
  `deleteDecision`'s existing pattern.

## Read paths (no Server Actions — called directly from Server Components; no auth required)

- `listPins(): Promise<PinWithPhotos[]>` — every published pin with its full photo gallery, for
  both the map view and the non-map accessible list (FR-005, FR-008). Publicly readable — does not
  call `requireCurrentUserId()`.
- `getPin(id: string): Promise<PinWithPhotos | null>` — full detail for one pin, including its
  gallery, for a pin's own detail page (FR-005, FR-006, FR-007). Publicly readable.
- `isPinOwnedByCurrentUser(pin: Pin): Promise<boolean>` — used by the UI to decide whether to show
  edit/delete/photo-management controls for a given pin (FR-012); returns `false` for a signed-out
  visitor rather than throwing, since viewing is always allowed.
