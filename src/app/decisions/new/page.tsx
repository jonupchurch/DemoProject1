import { DecisionForm } from "@/components/decisions/decision-form";

export const metadata = {
  title: "Log a decision — Decision Journal",
};

export default function NewDecisionPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Log a decision</h1>
      <DecisionForm />
    </main>
  );
}
