import Link from "next/link";
import { auth } from "@/auth";
import { SignInButtons } from "@/components/auth/sign-in-buttons";

const FEATURES = [
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
];

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold text-brand-600 sm:text-5xl">Decision Journal</h1>
        <p className="max-w-xl text-lg text-gray-600">
          A personal tool for tracking the decisions you make — and finding out, later, whether
          your instincts were right.
        </p>
        {session?.user ? (
          <Link
            href="/decisions"
            className="rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
          >
            Go to your decisions
          </Link>
        ) : (
          <SignInButtons />
        )}
      </section>

      <section className="mt-20 grid gap-8 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-card border border-gray-200 p-6">
            <h2 className="mb-2 font-semibold">{feature.title}</h2>
            <p className="text-sm text-gray-600">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-20 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
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
