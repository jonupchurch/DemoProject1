import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
      <p>
        &copy; {year} Jon Upchurch &middot;{" "}
        <Link href="/about" className="text-brand-600 underline">
          About
        </Link>
      </p>
    </footer>
  );
}
