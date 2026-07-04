/**
 * Formats a date-only value (e.g. Decision.reviewDate, stored as Postgres
 * DATE with no time component) using UTC so the calendar day displayed never
 * shifts based on the viewer's local timezone.
 */
export function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { timeZone: "UTC" });
}

/** Formats a date-only value as "YYYY-MM-DD" for an `<input type="date">` value, using UTC. */
export function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
