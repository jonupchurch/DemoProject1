"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveDecision, updateResolution } from "@/actions/decisions";
import { VERDICTS, ResolveInput } from "@/lib/decision-types";

interface ResolveFormProps {
  decisionId: string;
  mode: "resolve" | "edit";
  initialValues?: ResolveInput;
  onDone?: () => void;
}

export function ResolveForm({ decisionId, mode, initialValues, onDone }: ResolveFormProps) {
  const router = useRouter();
  const [verdict, setVerdict] = useState<ResolveInput["verdict"]>(
    initialValues?.verdict ?? VERDICTS[0],
  );
  const [satisfaction, setSatisfaction] = useState(initialValues?.satisfaction ?? 3);
  const [learnings, setLearnings] = useState(initialValues?.learnings ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const input: ResolveInput = { verdict, satisfaction, learnings: learnings || undefined };
    const result =
      mode === "resolve"
        ? await resolveDecision(decisionId, input)
        : await updateResolution(decisionId, input);

    setIsSubmitting(false);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {errors._root && <p className="text-sm text-verdict-wrong">{errors._root}</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="verdict" className="font-medium">
          Verdict
        </label>
        <select
          id="verdict"
          value={verdict}
          onChange={(e) => setVerdict(e.target.value as ResolveInput["verdict"])}
          className="rounded-card border border-gray-300 px-3 py-2"
        >
          {VERDICTS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {errors.verdict && <p className="text-sm text-verdict-wrong">{errors.verdict}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="satisfaction" className="font-medium">
          Satisfaction: {satisfaction} / 5
        </label>
        <input
          id="satisfaction"
          type="range"
          min={1}
          max={5}
          value={satisfaction}
          onChange={(e) => setSatisfaction(Number(e.target.value))}
        />
        {errors.satisfaction && (
          <p className="text-sm text-verdict-wrong">{errors.satisfaction}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="learnings" className="font-medium">
          What did you learn? (optional)
        </label>
        <textarea
          id="learnings"
          value={learnings}
          onChange={(e) => setLearnings(e.target.value)}
          className="rounded-card border border-gray-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : mode === "resolve" ? "Resolve decision" : "Update resolution"}
      </button>
    </form>
  );
}
