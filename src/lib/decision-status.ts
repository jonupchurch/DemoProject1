/**
 * True when a decision's review date has arrived or passed, compared using
 * UTC day boundaries (reviewDate is stored as a Postgres DATE with no time
 * component — see data-model.md). FR-006.
 */
export function isReviewOverdue(reviewDate: Date | string): boolean {
  const d = typeof reviewDate === "string" ? new Date(reviewDate) : reviewDate;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return d.getTime() <= todayUtc;
}
