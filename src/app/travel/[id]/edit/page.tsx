import { notFound, redirect } from "next/navigation";
import { requireCurrentUserId } from "@/lib/session";
import { getPin, isPinOwnedByCurrentUser } from "@/lib/travel";
import { PinForm } from "@/components/travel/pin-form";

export const metadata = {
  title: "Edit pin — Travel",
};

export default async function EditPinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Defense in depth alongside src/proxy.ts's edge matcher (CVE-2025-29927),
  // same pattern as every other protected page.
  await requireCurrentUserId();

  const { id } = await params;
  const pin = await getPin(id);

  if (!pin) {
    notFound();
  }

  // FR-009, FR-011 (NON-NEGOTIABLE): only the owner reaches the edit form —
  // anyone else is sent back to the (public) detail page rather than shown
  // controls that would only fail on submit anyway.
  if (!(await isPinOwnedByCurrentUser(pin))) {
    redirect(`/travel/${id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Edit pin</h1>
      <PinForm mode="edit" pin={pin} />
    </main>
  );
}
