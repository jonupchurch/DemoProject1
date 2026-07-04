import { requireCurrentUserId } from "@/lib/session";
import { PinForm } from "@/components/travel/pin-form";

export const metadata = {
  title: "Publish a pin — Travel",
};

export default async function NewPinPage() {
  // Defense in depth alongside src/proxy.ts's edge matcher (CVE-2025-29927),
  // same pattern as every other protected page on the site.
  await requireCurrentUserId();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Publish a pin</h1>
      <PinForm />
    </main>
  );
}
