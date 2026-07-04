import type { DecisionWithDetails } from "@/lib/decisions";

/**
 * A decision's "timeline date" is its reviewDate while Pending, or its
 * resolution's resolvedAt once Resolved (spec.md Assumptions).
 */
function timelineDate(decision: DecisionWithDetails): Date {
  return decision.status === "Resolved" && decision.resolution
    ? decision.resolution.resolvedAt
    : decision.reviewDate;
}

/**
 * Orders decisions most-recent-first by timelineDate, with a stable
 * tie-break on createdAt (also most-recent-first) for same-date entries
 * (edge case, spec.md). Pure — does not mutate its input.
 */
export function sortDecisionsForTimeline(
  decisions: DecisionWithDetails[],
): DecisionWithDetails[] {
  return [...decisions].sort((a, b) => {
    const dateDiff = timelineDate(b).getTime() - timelineDate(a).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}
