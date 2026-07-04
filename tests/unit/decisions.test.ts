import { describe, expect, it } from "vitest";
import {
  CreateDecisionInput,
  ResolveInput,
  validateCreateDecisionInput,
  validateResolveInput,
} from "@/lib/decisions";

function validInput(overrides: Partial<CreateDecisionInput> = {}): CreateDecisionInput {
  return {
    title: "Lease or buy a car?",
    options: [{ name: "Lease", pros: "Lower payment", cons: "Mileage limits" }],
    confidence: 60,
    category: "Financial",
    reviewDate: "2026-10-01",
    ...overrides,
  };
}

describe("validateCreateDecisionInput", () => {
  it("accepts a fully valid input", () => {
    expect(validateCreateDecisionInput(validInput())).toEqual({});
  });

  it("requires a title", () => {
    const errors = validateCreateDecisionInput(validInput({ title: "  " }));
    expect(errors.title).toBeDefined();
  });

  it("requires at least one option", () => {
    const errors = validateCreateDecisionInput(validInput({ options: [] }));
    expect(errors.options).toBeDefined();
  });

  it("requires every option to have a name", () => {
    const errors = validateCreateDecisionInput(
      validInput({ options: [{ name: "" }] }),
    );
    expect(errors["options.0.name"]).toBeDefined();
  });

  it("allows an option's pros/cons to be blank", () => {
    const errors = validateCreateDecisionInput(
      validInput({ options: [{ name: "Lease" }] }),
    );
    expect(errors).toEqual({});
  });

  it.each([-1, 101, 50.5])(
    "rejects a confidence level of %s (out of 0-100 range or non-integer)",
    (confidence) => {
      const errors = validateCreateDecisionInput(validInput({ confidence }));
      expect(errors.confidence).toBeDefined();
    },
  );

  it.each([0, 50, 100])("accepts a confidence level of %s", (confidence) => {
    const errors = validateCreateDecisionInput(validInput({ confidence }));
    expect(errors.confidence).toBeUndefined();
  });

  it("rejects an invalid category", () => {
    // @ts-expect-error intentionally invalid for the test
    const errors = validateCreateDecisionInput(validInput({ category: "Invalid" }));
    expect(errors.category).toBeDefined();
  });

  it("rejects an unparsable review date", () => {
    const errors = validateCreateDecisionInput(validInput({ reviewDate: "not-a-date" }));
    expect(errors.reviewDate).toBeDefined();
  });

  it("accepts a review date in the past", () => {
    const errors = validateCreateDecisionInput(validInput({ reviewDate: "2020-01-01" }));
    expect(errors.reviewDate).toBeUndefined();
  });
});

function validResolveInput(overrides: Partial<ResolveInput> = {}): ResolveInput {
  return {
    verdict: "Right",
    satisfaction: 4,
    learnings: "Should have negotiated harder.",
    ...overrides,
  };
}

describe("validateResolveInput", () => {
  it("accepts a fully valid input", () => {
    expect(validateResolveInput(validResolveInput())).toEqual({});
  });

  it("rejects an invalid verdict", () => {
    // @ts-expect-error intentionally invalid for the test
    const errors = validateResolveInput(validResolveInput({ verdict: "Sideways" }));
    expect(errors.verdict).toBeDefined();
  });

  it.each(["Right", "Wrong", "Mixed"] as const)("accepts verdict %s", (verdict) => {
    const errors = validateResolveInput(validResolveInput({ verdict }));
    expect(errors.verdict).toBeUndefined();
  });

  it.each([0, 6, 2.5])(
    "rejects a satisfaction score of %s (out of 1-5 range or non-integer)",
    (satisfaction) => {
      const errors = validateResolveInput(validResolveInput({ satisfaction }));
      expect(errors.satisfaction).toBeDefined();
    },
  );

  it.each([1, 3, 5])("accepts a satisfaction score of %s", (satisfaction) => {
    const errors = validateResolveInput(validResolveInput({ satisfaction }));
    expect(errors.satisfaction).toBeUndefined();
  });

  it("allows learnings to be omitted", () => {
    const errors = validateResolveInput(validResolveInput({ learnings: undefined }));
    expect(errors).toEqual({});
  });
});
