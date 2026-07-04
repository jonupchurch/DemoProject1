import Link from "next/link";
import { listDecisions, countDecisions } from "@/lib/decisions";
import { sortDecisionsForTimeline } from "@/lib/timeline";
import { formatDateOnly } from "@/lib/format";
import { parseDecisionFilters } from "@/lib/decision-filters";
import { DecisionFilterControls } from "@/components/decisions/decision-filter-controls";
import { DecisionSearchInput } from "@/components/decisions/decision-search-input";

export const metadata = {
  title: "Timeline — Decision Journal",
};

export const dynamic = "force-dynamic";

const VERDICT_STYLES: Record<string, string> = {
  Right: "bg-verdict-right-bg text-verdict-right",
  Wrong: "bg-verdict-wrong-bg text-verdict-wrong",
  Mixed: "bg-verdict-mixed-bg text-verdict-mixed",
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDecisionFilters(await searchParams);
  const [decisions, totalCount] = await Promise.all([
    listDecisions(filters),
    countDecisions(),
  ]);
  const timeline = sortDecisionsForTimeline(decisions);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Timeline</h1>

      {totalCount > 0 && (
        <>
          <DecisionSearchInput />
          <DecisionFilterControls />
        </>
      )}

      {totalCount === 0 ? (
        <p className="text-gray-600">
          You haven&apos;t logged any decisions yet.{" "}
          <Link href="/decisions/new" className="text-brand-600 underline">
            Log your first decision
          </Link>{" "}
          to get started.
        </p>
      ) : timeline.length === 0 ? (
        <p className="text-gray-600">
          No decisions match your current filters or search.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {timeline.map((decision) => (
            <li key={decision.id}>
              <Link
                href={`/decisions/${decision.id}`}
                className="block rounded-card border border-gray-300 p-4 hover:border-brand-500"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{decision.title}</span>
                  <span
                    className={
                      decision.status === "Pending"
                        ? "rounded-card bg-status-pending-bg px-2 py-1 text-sm text-status-pending"
                        : "rounded-card bg-status-resolved-bg px-2 py-1 text-sm text-status-resolved"
                    }
                  >
                    {decision.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    {decision.status === "Resolved" && decision.resolution
                      ? `Resolved ${formatDateOnly(decision.resolution.resolvedAt)}`
                      : `Review by ${formatDateOnly(decision.reviewDate)}`}
                  </span>
                  <span>· {decision.category}</span>
                  {decision.status === "Resolved" && decision.resolution && (
                    <span
                      className={`rounded-card px-2 py-1 text-xs ${VERDICT_STYLES[decision.resolution.verdict]}`}
                    >
                      {decision.resolution.verdict}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
