"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, STATUSES, VERDICTS } from "@/lib/decision-types";

const FIELDS = [
  { key: "category", legend: "Category", options: CATEGORIES },
  { key: "status", legend: "Status", options: STATUSES },
  { key: "verdict", legend: "Verdict", options: VERDICTS },
] as const;

// FR-001–FR-005: multi-select checkboxes per filter dimension, combined with
// AND across dimensions (handled server-side in listDecisions). State lives
// entirely in the URL so /decisions and /decisions/timeline share behavior
// identically (FR-011) without any client-side state of their own.
export function DecisionFilterControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);
    params.delete(key);
    if (current.includes(value)) {
      for (const v of current) {
        if (v !== value) params.append(key, v);
      }
    } else {
      for (const v of current) params.append(key, v);
      params.append(key, value);
    }
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("status");
    params.delete("verdict");
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  const hasActiveFilters =
    searchParams.getAll("category").length > 0 ||
    searchParams.getAll("status").length > 0 ||
    searchParams.getAll("verdict").length > 0;

  return (
    <div className="mb-6 flex flex-wrap gap-6 rounded-card border border-gray-300 p-4">
      {FIELDS.map(({ key, legend, options }) => {
        const active = searchParams.getAll(key);
        return (
          <fieldset key={key} className="flex flex-col gap-1">
            <legend className="text-sm font-medium">{legend}</legend>
            <div className="flex flex-wrap gap-3">
              {options.map((option) => (
                <label key={option} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={active.includes(option)}
                    onChange={() => toggle(key, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="self-start text-sm text-brand-600 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
