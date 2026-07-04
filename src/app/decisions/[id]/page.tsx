import Link from "next/link";
import { notFound } from "next/navigation";
import { getDecision } from "@/lib/decisions";
import { formatDateOnly } from "@/lib/format";
import { ResolutionPanel } from "@/components/decisions/resolution-panel";
import { DeleteDecisionButton } from "@/components/decisions/delete-decision-button";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decision = await getDecision(id);

  if (!decision) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{decision.title}</h1>
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

      <dl className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Category</dt>
          <dd>{decision.category}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Confidence</dt>
          <dd>{decision.confidence}%</dd>
        </div>
        <div>
          <dt className="text-gray-500">Review date</dt>
          <dd>{formatDateOnly(decision.reviewDate)}</dd>
        </div>
        {decision.cost != null && (
          <div>
            <dt className="text-gray-500">Estimated cost</dt>
            <dd>{decision.cost.toString()}</dd>
          </div>
        )}
      </dl>

      <h2 className="mb-3 text-lg font-semibold">Options considered</h2>
      <ul className="mb-6 flex flex-col gap-3">
        {decision.options.map((option) => (
          <li key={option.id} className="rounded-card border border-gray-300 p-4">
            <p className="font-medium">{option.name}</p>
            {option.pros && (
              <p className="mt-1 text-sm">
                <span className="text-gray-500">Pros: </span>
                {option.pros}
              </p>
            )}
            {option.cons && (
              <p className="mt-1 text-sm">
                <span className="text-gray-500">Cons: </span>
                {option.cons}
              </p>
            )}
          </li>
        ))}
      </ul>

      {decision.risks && (
        <div className="mb-4">
          <h2 className="mb-1 text-lg font-semibold">Risks</h2>
          <p className="text-sm">{decision.risks}</p>
        </div>
      )}

      {decision.notes && (
        <div className="mb-4">
          <h2 className="mb-1 text-lg font-semibold">Notes</h2>
          <p className="text-sm">{decision.notes}</p>
        </div>
      )}

      {decision.status === "Resolved" && (
        <p className="mb-4 text-xs text-gray-500">
          This decision has been resolved — the entry above is locked.
        </p>
      )}

      <ResolutionPanel decisionId={decision.id} resolution={decision.resolution} />

      <div className="mt-8 flex items-center gap-4 border-t border-gray-200 pt-4">
        {decision.status === "Pending" && (
          <Link
            href={`/decisions/${decision.id}/edit`}
            className="text-sm text-brand-600 underline"
          >
            Edit decision
          </Link>
        )}
        <DeleteDecisionButton decisionId={decision.id} />
      </div>
    </main>
  );
}
