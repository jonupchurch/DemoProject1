import type { Category, Verdict } from "@prisma/client";
import { CATEGORIES } from "@/lib/decision-types";

/** FR-005: Right counts fully, Wrong counts as none, Mixed counts as half credit. */
export function scoreVerdict(verdict: Verdict): number {
  switch (verdict) {
    case "Right":
      return 1;
    case "Wrong":
      return 0;
    case "Mixed":
      return 0.5;
  }
}

export const CONFIDENCE_BANDS = ["0-20", "21-40", "41-60", "61-80", "81-100"] as const;
export type ConfidenceBand = (typeof CONFIDENCE_BANDS)[number];

/** Fixed five 20-point-wide bands (spec.md Assumptions) for a 0-100 inclusive confidence value. */
export function bucketConfidence(confidence: number): ConfidenceBand {
  if (confidence <= 20) return "0-20";
  if (confidence <= 40) return "21-40";
  if (confidence <= 60) return "41-60";
  if (confidence <= 80) return "61-80";
  return "81-100";
}

export interface ResolvedDecisionForCalibration {
  confidence: number;
  category: Category;
  verdict: Verdict;
  satisfaction: number;
}

export interface CalibrationBucket {
  label: string;
  accuracyRate: number;
  count: number;
}

export interface CalibrationSummary {
  byBand: CalibrationBucket[];
  byCategory: CalibrationBucket[];
}

function summarize(decisions: ResolvedDecisionForCalibration[]): {
  accuracyRate: number;
  count: number;
} {
  const count = decisions.length;
  const accuracyRate =
    decisions.reduce((sum, d) => sum + scoreVerdict(d.verdict), 0) / count;
  return { accuracyRate, count };
}

/**
 * Groups resolved decisions by confidence band and by category, each in
 * fixed order, omitting any bucket with zero contributing decisions
 * (FR-006).
 */
export function aggregateCalibration(
  decisions: ResolvedDecisionForCalibration[],
): CalibrationSummary {
  const byBand: CalibrationBucket[] = [];
  for (const label of CONFIDENCE_BANDS) {
    const inBand = decisions.filter((d) => bucketConfidence(d.confidence) === label);
    if (inBand.length > 0) {
      byBand.push({ label, ...summarize(inBand) });
    }
  }

  const byCategory: CalibrationBucket[] = [];
  for (const label of CATEGORIES) {
    const inCategory = decisions.filter((d) => d.category === label);
    if (inCategory.length > 0) {
      byCategory.push({ label, ...summarize(inCategory) });
    }
  }

  return { byBand, byCategory };
}
