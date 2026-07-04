import { describe, expect, it } from "vitest";
import {
  aggregateCalibration,
  bucketConfidence,
  scoreVerdict,
  type ResolvedDecisionForCalibration,
} from "@/lib/calibration";

function decision(
  overrides: Partial<ResolvedDecisionForCalibration> = {},
): ResolvedDecisionForCalibration {
  return {
    confidence: 70,
    category: "Financial",
    verdict: "Right",
    satisfaction: 4,
    ...overrides,
  };
}

describe("scoreVerdict", () => {
  it.each([
    ["Right", 1],
    ["Wrong", 0],
    ["Mixed", 0.5],
  ] as const)("scores %s as %s", (verdict, expected) => {
    expect(scoreVerdict(verdict)).toBe(expected);
  });
});

describe("bucketConfidence", () => {
  it.each([
    [0, "0-20"],
    [20, "0-20"],
    [21, "21-40"],
    [40, "21-40"],
    [41, "41-60"],
    [60, "41-60"],
    [61, "61-80"],
    [80, "61-80"],
    [81, "81-100"],
    [100, "81-100"],
  ] as const)("maps confidence %s to band %s", (confidence, expected) => {
    expect(bucketConfidence(confidence)).toBe(expected);
  });
});

describe("aggregateCalibration - byBand (spec.md US1)", () => {
  it("returns empty arrays for no resolved decisions (US3)", () => {
    expect(aggregateCalibration([])).toEqual({ byBand: [], byCategory: [] });
  });

  it("computes the correct mean accuracy and count for a single populated band", () => {
    const decisions = [
      decision({ confidence: 70, verdict: "Right" }),
      decision({ confidence: 75, verdict: "Wrong" }),
      decision({ confidence: 80, verdict: "Mixed" }),
    ];

    const { byBand } = aggregateCalibration(decisions);

    expect(byBand).toEqual([{ label: "61-80", accuracyRate: 0.5, count: 3 }]);
  });

  it("omits bands with zero contributing decisions (FR-006)", () => {
    const decisions = [decision({ confidence: 10, verdict: "Right" })];

    const { byBand } = aggregateCalibration(decisions);

    expect(byBand).toEqual([{ label: "0-20", accuracyRate: 1, count: 1 }]);
    expect(byBand.map((b) => b.label)).not.toContain("81-100");
  });

  it("keeps multiple populated bands separate", () => {
    const decisions = [
      decision({ confidence: 10, verdict: "Right" }),
      decision({ confidence: 90, verdict: "Wrong" }),
    ];

    const { byBand } = aggregateCalibration(decisions);

    expect(byBand).toEqual([
      { label: "0-20", accuracyRate: 1, count: 1 },
      { label: "81-100", accuracyRate: 0, count: 1 },
    ]);
  });
});

describe("aggregateCalibration - byCategory (spec.md US2)", () => {
  it("computes the correct mean accuracy and count per category", () => {
    const decisions = [
      decision({ category: "Financial", verdict: "Right" }),
      decision({ category: "Financial", verdict: "Wrong" }),
      decision({ category: "Career", verdict: "Mixed" }),
    ];

    const { byCategory } = aggregateCalibration(decisions);

    expect(byCategory).toEqual([
      { label: "Financial", accuracyRate: 0.5, count: 2 },
      { label: "Career", accuracyRate: 0.5, count: 1 },
    ]);
  });

  it("omits categories with zero contributing decisions (FR-006)", () => {
    const decisions = [decision({ category: "Housing", verdict: "Right" })];

    const { byCategory } = aggregateCalibration(decisions);

    expect(byCategory).toEqual([{ label: "Housing", accuracyRate: 1, count: 1 }]);
    expect(byCategory.map((c) => c.label)).not.toContain("Relationships");
  });
});
