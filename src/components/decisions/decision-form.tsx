"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDecision, updateDecision } from "@/actions/decisions";
import { CATEGORIES, CreateDecisionInput, OptionInput } from "@/lib/decision-types";

const emptyOption: OptionInput = { name: "", pros: "", cons: "" };

interface DecisionFormProps {
  mode?: "create" | "edit";
  decisionId?: string;
  initialValues?: CreateDecisionInput;
}

export function DecisionForm({ mode = "create", decisionId, initialValues }: DecisionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [options, setOptions] = useState<OptionInput[]>(
    initialValues?.options ?? [{ ...emptyOption }],
  );
  const [cost, setCost] = useState(initialValues?.cost?.toString() ?? "");
  const [risks, setRisks] = useState(initialValues?.risks ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [confidence, setConfidence] = useState(initialValues?.confidence ?? 50);
  const [category, setCategory] = useState<CreateDecisionInput["category"]>(
    initialValues?.category ?? CATEGORIES[0],
  );
  const [reviewDate, setReviewDate] = useState(initialValues?.reviewDate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateOption(index: number, patch: Partial<OptionInput>) {
    setOptions((prev) =>
      prev.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );
  }

  function addOption() {
    setOptions((prev) => [...prev, { ...emptyOption }]);
  }

  function removeOption(index: number) {
    setOptions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const input: CreateDecisionInput = {
      title,
      options,
      cost: cost ? Number(cost) : undefined,
      risks: risks || undefined,
      notes: notes || undefined,
      confidence,
      category,
      reviewDate,
    };

    const result =
      mode === "edit" && decisionId
        ? await updateDecision(decisionId, input)
        : await createDecision(input);

    setIsSubmitting(false);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    router.push(`/decisions/${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {errors._root && <p className="text-sm text-verdict-wrong">{errors._root}</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-verdict-wrong">
            {errors.title}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-medium">Options being considered</legend>
        {errors.options && <p className="text-sm text-verdict-wrong">{errors.options}</p>}

        {options.map((option, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-card border border-gray-300 p-4 dark:border-gray-700">
            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor={`option-name-${index}`} className="text-sm font-medium">
                  Option name
                </label>
                <input
                  id={`option-name-${index}`}
                  type="text"
                  value={option.name}
                  onChange={(e) => updateOption(index, { name: e.target.value })}
                  className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  aria-invalid={Boolean(errors[`options.${index}.name`])}
                />
              </div>
              {options.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-3 py-2 text-sm text-verdict-wrong"
                  aria-label={`Remove option ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
            {errors[`options.${index}.name`] && (
              <p className="text-sm text-verdict-wrong">{errors[`options.${index}.name`]}</p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor={`option-pros-${index}`} className="text-sm font-medium">
                Pros
              </label>
              <textarea
                id={`option-pros-${index}`}
                value={option.pros}
                onChange={(e) => updateOption(index, { pros: e.target.value })}
                className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor={`option-cons-${index}`} className="text-sm font-medium">
                Cons
              </label>
              <textarea
                id={`option-cons-${index}`}
                value={option.cons}
                onChange={(e) => updateOption(index, { cons: e.target.value })}
                className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addOption}
          className="self-start rounded-card border border-brand-500 px-4 py-2 text-brand-600"
        >
          Add another option
        </button>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="cost" className="font-medium">
          Estimated cost (optional)
        </label>
        <input
          id="cost"
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="risks" className="font-medium">
          Risks (optional)
        </label>
        <textarea
          id="risks"
          value={risks}
          onChange={(e) => setRisks(e.target.value)}
          className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confidence" className="font-medium">
          Confidence: {confidence}%
        </label>
        <input
          id="confidence"
          type="range"
          min={0}
          max={100}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          aria-invalid={Boolean(errors.confidence)}
        />
        {errors.confidence && <p className="text-sm text-verdict-wrong">{errors.confidence}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="font-medium">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as CreateDecisionInput["category"])}
          className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reviewDate" className="font-medium">
          Review date
        </label>
        <input
          id="reviewDate"
          type="date"
          value={reviewDate}
          onChange={(e) => setReviewDate(e.target.value)}
          className="rounded-card border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          aria-invalid={Boolean(errors.reviewDate)}
        />
        {errors.reviewDate && <p className="text-sm text-verdict-wrong">{errors.reviewDate}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Save decision"}
      </button>
    </form>
  );
}
