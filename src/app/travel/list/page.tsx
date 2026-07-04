import { listPins } from "@/lib/travel";
import { PinList } from "@/components/travel/pin-list";

export const metadata = {
  title: "Travel (list view) — Jon Upchurch Showcase",
};

// Public — new pins can appear at any time, for any visitor.
export const dynamic = "force-dynamic";

export default async function TravelListPage() {
  const pins = await listPins();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Travel — list view</h1>
      <PinList pins={pins} />
    </main>
  );
}
