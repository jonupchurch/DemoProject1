# Phase 1 Contracts: Server Actions

Same internal-contract approach as `specs/001-decision-log-revisit/contracts/server-actions.md` —
no external API consumers exist for this app either, so this documents the function signatures
`src/actions/travel.ts` exposes to the UI layer.

Every mutating action reads the current session's user id itself (via the existing
`requireCurrentUserId()`, `src/lib/session.ts`) — none accept an `ownerId`/`pinId`-owner parameter
from the client, so a caller cannot claim ownership of someone else's pin by passing a different id
(constitution Principle VIII).

**Photos are uploaded before either Server Action runs** (research.md §5, added during
implementation) — `createPin`/`addPhotoToPin` never receive a raw `File`, only an already-uploaded
`UploadedPhoto` reference (`{ url, contentType }`). See "Upload routes" below for how a `File`
becomes one of these. This is what keeps a multi-photo gallery from ever exceeding Vercel's hard
4.5MB serverless-function request-body cap — the bytes never pass through a Server Action at all.

## `createPin(input: CreatePinInput): Promise<PinWithPhotos>`

```text
CreatePinInput = {
  latitude: number         // -90 to 90 (FR-004)
  longitude: number        // -180 to 180 (FR-004)
  caption?: string
  photos: UploadedPhoto[]  // length >= 1 (FR-001, FR-010); { url, contentType } — already uploaded
}
```

- Requires an authenticated session; rejects otherwise (FR-002).
- Rejects with a field-level validation error if `latitude`/`longitude` are missing/out of range,
  or `photos` is empty (FR-001, FR-004).
- On success: persists a `Pin` owned by the current session's user together with its `Photo` rows
  (referencing the already-uploaded URLs), and returns it with photos attached in upload order.

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

## `addPhotoToPin(pinId: string, photo: UploadedPhoto): Promise<Photo>`

- Rejects unless the current session's user owns the target `Pin`.
- `photo` is already uploaded (see "Upload routes" below) — this only persists the `Photo` row.
- On success: persists a new `Photo` row appended to the end of the pin's gallery order (FR-009).

## Upload routes (not Server Actions — where a `File` actually becomes an `UploadedPhoto`)

- **Production** — `POST /api/travel-photos/upload-token`: issues a short-lived Vercel Blob client
  token (rejecting if unauthenticated), consumed by `@vercel/blob/client`'s `upload()` running in
  the browser. The file's bytes go straight from the browser to Blob storage; this route never
  receives them.
- **Dev/test** — `POST /api/travel-photos/upload-local`: a same-origin Route Handler (rejecting if
  unauthenticated) that validates the file (type/size, research.md §3) and writes it via the
  local-filesystem `PhotoStorage` driver, returning `{ url, contentType }`.
- Both are wrapped by the client helper `uploadPhotoFile(file): Promise<UploadedPhoto>`
  (`src/lib/upload-photo.ts`), which picks the right one by environment — UI code never calls
  either route directly.

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
