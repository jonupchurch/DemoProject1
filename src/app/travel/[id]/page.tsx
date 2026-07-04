import Link from "next/link";
import { notFound } from "next/navigation";
import { getPin, isPinOwnedByCurrentUser } from "@/lib/travel";
import { PinGallery } from "@/components/travel/pin-gallery";

export const dynamic = "force-dynamic";

/** FR-006: raw lat/long plus a link to an external map service — no API key needed. */
function openStreetMapUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export default async function PinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pin = await getPin(id);

  if (!pin) {
    notFound();
  }

  // FR-012: shown only to the account that created this pin — false (no
  // controls) for a signed-out visitor or any other authenticated account.
  const isOwner = await isPinOwnedByCurrentUser(pin);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        {pin.caption && <h1 className="text-2xl font-bold">{pin.caption}</h1>}
        {isOwner && (
          <Link
            href={`/travel/${pin.id}/edit`}
            className="rounded-card border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Edit
          </Link>
        )}
      </div>

      <PinGallery photos={pin.photos} caption={pin.caption} />

      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        Location: {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)} —{" "}
        <a
          href={openStreetMapUrl(pin.latitude, pin.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline"
        >
          View on OpenStreetMap
        </a>
      </p>
    </main>
  );
}
