import { describe, expect, it } from "vitest";
import { parseDecisionFilters } from "@/lib/decision-filters";

describe("parseDecisionFilters - category/status/verdict (spec.md US1)", () => {
  it("parses a single value for each field", () => {
    const params = new URLSearchParams({ category: "Financial", status: "Pending", verdict: "Right" });
    expect(parseDecisionFilters(params)).toEqual({
      categories: ["Financial"],
      statuses: ["Pending"],
      verdicts: ["Right"],
      search: undefined,
    });
  });

  it("parses multiple values for each field (repeated params)", () => {
    const params = new URLSearchParams();
    params.append("category", "Financial");
    params.append("category", "Career");
    params.append("status", "Pending");
    params.append("status", "Resolved");
    params.append("verdict", "Right");
    params.append("verdict", "Mixed");

    const result = parseDecisionFilters(params);
    expect(result.categories).toEqual(["Financial", "Career"]);
    expect(result.statuses).toEqual(["Pending", "Resolved"]);
    expect(result.verdicts).toEqual(["Right", "Mixed"]);
  });

  it("ignores an unknown/invalid value for each field rather than erroring", () => {
    const params = new URLSearchParams({
      category: "NotACategory",
      status: "NotAStatus",
      verdict: "NotAVerdict",
    });
    expect(parseDecisionFilters(params)).toEqual({
      categories: [],
      statuses: [],
      verdicts: [],
      search: undefined,
    });
  });

  it("returns empty arrays when no filters are present at all", () => {
    expect(parseDecisionFilters(new URLSearchParams())).toEqual({
      categories: [],
      statuses: [],
      verdicts: [],
      search: undefined,
    });
  });

  it("also accepts Next.js's plain searchParams object shape", () => {
    const result = parseDecisionFilters({ category: ["Financial", "Career"], status: "Pending" });
    expect(result.categories).toEqual(["Financial", "Career"]);
    expect(result.statuses).toEqual(["Pending"]);
  });
});

describe("parseDecisionFilters - search (spec.md US2)", () => {
  it("trims and keeps a normal search term", () => {
    const result = parseDecisionFilters(new URLSearchParams({ q: "  lease vs buy  " }));
    expect(result.search).toBe("lease vs buy");
  });

  it("treats a missing q param as no search term", () => {
    expect(parseDecisionFilters(new URLSearchParams()).search).toBeUndefined();
  });

  it("treats an empty or whitespace-only q param as no search term (edge case)", () => {
    expect(parseDecisionFilters(new URLSearchParams({ q: "" })).search).toBeUndefined();
    expect(parseDecisionFilters(new URLSearchParams({ q: "   " })).search).toBeUndefined();
  });
});
