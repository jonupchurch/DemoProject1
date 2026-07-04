"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// FR-006/FR-007: a debounced search box so typing doesn't trigger a
// navigation per keystroke. Shares the same URL-search-params state as
// DecisionFilterControls, so /decisions and /decisions/timeline behave
// identically (FR-011) with no state of their own beyond the URL.
export function DecisionSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (value === current) return;

      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    }, 300);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="mb-6 flex flex-col gap-1">
      <label htmlFor="decision-search" className="text-sm font-medium">
        Search
      </label>
      <input
        id="decision-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search title, risks, notes, learnings..."
        className="rounded-card border border-gray-300 px-3 py-2 sm:max-w-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
    </div>
  );
}
