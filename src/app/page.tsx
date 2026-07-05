import Link from "next/link";
import { auth } from "@/auth";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import {
  AppShowcaseCarousel,
  type AppShowcaseSlide,
} from "@/components/home/app-showcase-carousel";

export default async function Home() {
  const session = await auth();

  // One slide per mini-app on this site (constitution's Multi-App
  // Structure) — more are added here, one entry each, as they ship
  // (Purpose section).
  const apps: AppShowcaseSlide[] = [
    {
      id: "decision-journal",
      title: "Decision Journal",
      subtitle:
        "A personal tool for tracking the decisions you make — and finding out, later, whether your instincts were right.",
      backgroundImage: "/img/image1.png",
      // Only used as a fallback if backgroundImage is ever removed.
      backgroundClassName: "bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900",
      cta: session?.user ? (
        <Link
          href="/decisions"
          className="rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
        >
          Go to your decisions
        </Link>
      ) : (
        <SignInButtons />
      ),
      features: [
        {
          title: "Log the decision, not just the outcome",
          body: "Capture what you're choosing between, your confidence level, and why — before you find out how it turns out.",
        },
        {
          title: "See how your instincts held up",
          body: "Revisit a decision later, record the real outcome, and compare it against the confidence you logged going in.",
        },
        {
          title: "Private by design",
          body: "Every decision belongs to your account alone, enforced at every layer — nobody else can see or touch your entries.",
        },
      ],
    },
    {
      id: "travel-photo-map",
      title: "Travel Photo Map",
      subtitle:
        "Pin the places you've been, publish a gallery of photos there, and browse everyone else's pins on a live, public map.",
      backgroundImage: "/img/image2.png",
      // Only used as a fallback if backgroundImage is ever removed.
      backgroundClassName: "bg-gradient-to-br from-teal-700 via-cyan-700 to-blue-900",
      cta: (
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/travel"
            className="rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
          >
            Explore the map
          </Link>
          {session?.user && (
            <Link
              href="/travel/new"
              className="rounded-card border border-white/70 px-6 py-3 font-medium text-white hover:bg-white/10"
            >
              Pin a photo
            </Link>
          )}
        </div>
      ),
      features: [
        {
          title: "Pin your favorite places",
          body: "Choose a point on the map, upload a gallery of photos, and publish — all in one flow, with a clear notice before it goes public.",
        },
        {
          title: "Browse publicly, no sign-in needed",
          body: "Every pin is visible to any visitor, via a live map or a simple accessible list — this is the one mini-app anyone can explore right away.",
        },
        {
          title: "Your pins, your control",
          body: "Only you can edit a pin's details, manage its photos, or delete it — enforced server-side on every request, not just hidden in the UI.",
        },
      ],
    },
    // TEMPORARY placeholder slide (lorem ipsum) proving the carousel
    // still handles 3+ slides correctly — remove once a real third
    // mini-app ships, or replace its content with that app's real copy.
    {
      id: "lorem-ipsum-placeholder",
      title: "Lorem Ipsum",
      subtitle:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      backgroundImage: "/img/image3.png",
      // Only used as a fallback if backgroundImage is ever removed.
      backgroundClassName: "bg-gradient-to-br from-gray-700 via-gray-600 to-gray-900",
      features: [
        {
          title: "Lorem ipsum dolor sit amet",
          body: "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
        {
          title: "Ut enim ad minim veniam",
          body: "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        },
        {
          title: "Duis aute irure dolor",
          body: "In reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        },
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <AppShowcaseCarousel apps={apps} />

      <section className="mt-20 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        <p>
          Built as a spec-driven-development portfolio project.{" "}
          <a
            href="https://github.com/jonupchurch/DemoProject1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline"
          >
            View the source on GitHub
          </a>
        </p>
      </section>
    </main>
  );
}
