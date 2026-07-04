import Link from "next/link";
import { listDecisions, countDecisions } from "@/lib/decisions";
import { formatDateOnly } from "@/lib/format";
import { isReviewOverdue } from "@/lib/decision-status";
import { parseDecisionFilters } from "@/lib/decision-filters";
import { DecisionFilterControls } from "@/components/decisions/decision-filter-controls";
import { DecisionSearchInput } from "@/components/decisions/decision-search-input";

export const metadata = {
  title: "Your decisions — Decision Journal",
};

// This page reads live data on every visit (new/resolved/deleted decisions,
// and which reviews have become overdue) — it must never be statically
// prerendered at build time.
export const dynamic = "force-dynamic";

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDecisionFilters(await searchParams);
  const [decisions, totalCount] = await Promise.all([
    listDecisions(filters),
    countDecisions(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your decisions</h1>
        <Link
          href="/decisions/new"
          className="rounded-card bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600"
        >
          Log a decision
        </Link>
      </div>

      {totalCount > 0 && (
        <>
          <DecisionSearchInput />
          <DecisionFilterControls />
        </>
      )}

      {totalCount === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          You haven&apos;t logged any decisions yet.{" "}
          <Link href="/decisions/new" className="text-brand-600 underline">
            Log your first decision
          </Link>{" "}
          to get started.
        </p>
      ) : decisions.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No decisions match your current filters or search.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {decisions.map((decision) => {
            const overdue =
              decision.status === "Pending" && isReviewOverdue(decision.reviewDate);
            return (
              <li key={decision.id}>
                <Link
                  href={`/decisions/${decision.id}`}
                  className="block rounded-card border border-gray-300 p-4 hover:border-brand-500 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{decision.title}</span>
                    <span
                      className={
                        overdue
                          ? "rounded-card bg-verdict-wrong-bg px-2 py-1 text-sm text-verdict-wrong"
                          : decision.status === "Pending"
                            ? "rounded-card bg-status-pending-bg px-2 py-1 text-sm text-status-pending"
                            : "rounded-card bg-status-resolved-bg px-2 py-1 text-sm text-status-resolved"
                      }
                    >
                      {overdue ? "Review due" : decision.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {decision.category} · Review by {formatDateOnly(decision.reviewDate)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
