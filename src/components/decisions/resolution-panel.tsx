"use client";

import { useState } from "react";
import type { Resolution } from "@prisma/client";
import { ResolveForm } from "@/components/decisions/resolve-form";
import { formatDateOnly } from "@/lib/format";

const VERDICT_STYLES: Record<Resolution["verdict"], string> = {
  Right: "bg-verdict-right-bg text-verdict-right",
  Wrong: "bg-verdict-wrong-bg text-verdict-wrong",
  Mixed: "bg-verdict-mixed-bg text-verdict-mixed",
};

export function ResolutionPanel({
  decisionId,
  resolution,
}: {
  decisionId: string;
  resolution: Resolution | null;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!resolution) {
    return (
      <div>
        <h2 className="mb-3 text-lg font-semibold">Resolve this decision</h2>
        <ResolveForm decisionId={decisionId} mode="resolve" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <h2 className="mb-3 text-lg font-semibold">Edit resolution</h2>
        <ResolveForm
          decisionId={decisionId}
          mode="edit"
          initialValues={{
            verdict: resolution.verdict,
            satisfaction: resolution.satisfaction,
            learnings: resolution.learnings ?? undefined,
          }}
          onDone={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Resolution</h2>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm text-brand-600 underline"
        >
          Edit resolution
        </button>
      </div>
      <div className="flex flex-col gap-2 rounded-card border border-gray-300 p-4 dark:border-gray-700">
        <span
          className={`self-start rounded-card px-2 py-1 text-sm ${VERDICT_STYLES[resolution.verdict]}`}
        >
          {resolution.verdict}
        </span>
        <p className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Satisfaction: </span>
          {resolution.satisfaction} / 5
        </p>
        {resolution.learnings && (
          <p className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Learnings: </span>
            {resolution.learnings}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Resolved {formatDateOnly(resolution.resolvedAt)}
        </p>
      </div>
    </div>
  );
}
