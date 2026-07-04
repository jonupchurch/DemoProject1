import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100">
      <h1 className="text-3xl font-bold text-brand-600">Decision Journal</h1>
      <Link
        href="/decisions"
        className="rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
      >
        View your decisions
      </Link>
    </main>
  );
}
