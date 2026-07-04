import { listPins } from "@/lib/travel";
import { TravelBrowse } from "@/components/travel/travel-browse";

export const metadata = {
  title: "Travel — Jon Upchurch Showcase",
};

// Public — new pins can appear at any time, for any visitor.
export const dynamic = "force-dynamic";

export default async function TravelPage() {
  const pins = await listPins();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Travel</h1>
      <TravelBrowse pins={pins} />
    </main>
  );
}
