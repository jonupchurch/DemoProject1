import { requireCurrentUserId } from "@/lib/session";

export const metadata = {
  title: "Contact — Jon Upchurch Showcase",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  // Same defense-in-depth pattern as every other gated page (proxy.ts gives
  // a fast-path edge redirect; this is the actual enforcement point per
  // CVE-2025-29927 — see src/lib/session.ts).
  await requireCurrentUserId();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-6 text-3xl font-bold text-brand-600">Contact</h1>
      <p className="text-gray-600">
        {/* TODO: build out the actual contact/CRM tool this page is a placeholder for */}
        Placeholder page — coming soon.
      </p>
    </main>
  );
}
