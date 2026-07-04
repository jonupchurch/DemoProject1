import type { Category, DecisionStatus, Verdict } from "@prisma/client";
import { CATEGORIES, STATUSES, VERDICTS } from "@/lib/decision-types";

export interface DecisionFilters {
  categories: Category[];
  statuses: DecisionStatus[];
  verdicts: Verdict[];
  search?: string;
}

/**
 * Matches both a real `URLSearchParams` (unit tests, client components via
 * `useSearchParams()`) and Next.js App Router's plain `searchParams` page
 * prop shape, so the same parsing logic runs identically on both
 * /decisions and /decisions/timeline (FR-011).
 */
export type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function getAllValues(searchParams: SearchParamsLike, key: string): string[] {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.getAll(key);
  }
  const value = searchParams[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Defensive parsing: unknown/invalid enum values are dropped rather than
 * erroring, so a stale or hand-edited URL degrades gracefully instead of
 * breaking the page.
 */
export function parseDecisionFilters(searchParams: SearchParamsLike): DecisionFilters {
  const categories = getAllValues(searchParams, "category").filter(
    (value): value is Category => (CATEGORIES as string[]).includes(value),
  );
  const statuses = getAllValues(searchParams, "status").filter(
    (value): value is DecisionStatus => (STATUSES as string[]).includes(value),
  );
  const verdicts = getAllValues(searchParams, "verdict").filter(
    (value): value is Verdict => (VERDICTS as string[]).includes(value),
  );

  const rawSearch = getAllValues(searchParams, "q")[0];
  const trimmedSearch = rawSearch?.trim();
  const search = trimmedSearch ? trimmedSearch : undefined;

  return { categories, statuses, verdicts, search };
}
