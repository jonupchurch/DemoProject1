import { notFound, redirect } from "next/navigation";
import { getDecision } from "@/lib/decisions";
import { DecisionForm } from "@/components/decisions/decision-form";
import { toDateInputValue } from "@/lib/format";

export const metadata = {
  title: "Edit decision — Decision Journal",
};

export default async function EditDecisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decision = await getDecision(id);

  if (!decision) {
    notFound();
  }

  if (decision.status !== "Pending") {
    // FR-009: a resolved decision's original entry is locked; there's
    // nothing to edit here.
    redirect(`/decisions/${id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Edit decision</h1>
      <DecisionForm
        mode="edit"
        decisionId={decision.id}
        initialValues={{
          title: decision.title,
          options: decision.options.map((option) => ({
            name: option.name,
            pros: option.pros ?? undefined,
            cons: option.cons ?? undefined,
          })),
          cost: decision.cost != null ? Number(decision.cost) : undefined,
          risks: decision.risks ?? undefined,
          notes: decision.notes ?? undefined,
          confidence: decision.confidence,
          category: decision.category,
          reviewDate: toDateInputValue(decision.reviewDate),
        }}
      />
    </main>
  );
}
