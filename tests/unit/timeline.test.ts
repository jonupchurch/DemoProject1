import { describe, expect, it } from "vitest";
import { sortDecisionsForTimeline } from "@/lib/timeline";
import type { DecisionWithDetails } from "@/lib/decisions";

function decision(overrides: Partial<DecisionWithDetails> = {}): DecisionWithDetails {
  return {
    id: "id",
    ownerId: "owner",
    title: "Title",
    cost: null,
    risks: null,
    notes: null,
    confidence: 50,
    category: "Other",
    reviewDate: new Date("2026-06-01"),
    status: "Pending",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    options: [],
    resolution: null,
    ...overrides,
  };
}

describe("sortDecisionsForTimeline (spec.md US3)", () => {
  it("returns an empty array for empty input", () => {
    expect(sortDecisionsForTimeline([])).toEqual([]);
  });

  it("orders Pending decisions by reviewDate, most recent first", () => {
    const older = decision({ id: "older", reviewDate: new Date("2026-01-01") });
    const newer = decision({ id: "newer", reviewDate: new Date("2026-06-01") });

    const result = sortDecisionsForTimeline([older, newer]);

    expect(result.map((d) => d.id)).toEqual(["newer", "older"]);
  });

  it("orders Resolved decisions by resolution.resolvedAt, not reviewDate", () => {
    const resolvedEarly = decision({
      id: "resolved-early",
      reviewDate: new Date("2026-12-01"), // far-future reviewDate, irrelevant once resolved
      status: "Resolved",
      resolution: {
        id: "r1",
        decisionId: "resolved-early",
        verdict: "Right",
        satisfaction: 4,
        learnings: null,
        resolvedAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-01"),
      },
    });
    const resolvedLate = decision({
      id: "resolved-late",
      reviewDate: new Date("2020-01-01"), // far-past reviewDate, irrelevant once resolved
      status: "Resolved",
      resolution: {
        id: "r2",
        decisionId: "resolved-late",
        verdict: "Wrong",
        satisfaction: 2,
        learnings: null,
        resolvedAt: new Date("2026-05-01"),
        updatedAt: new Date("2026-05-01"),
      },
    });

    const result = sortDecisionsForTimeline([resolvedEarly, resolvedLate]);

    expect(result.map((d) => d.id)).toEqual(["resolved-late", "resolved-early"]);
  });

  it("interleaves Pending and Resolved decisions by their respective dates", () => {
    const pending = decision({ id: "pending", reviewDate: new Date("2026-03-01") });
    const resolved = decision({
      id: "resolved",
      status: "Resolved",
      resolution: {
        id: "r1",
        decisionId: "resolved",
        verdict: "Mixed",
        satisfaction: 3,
        learnings: null,
        resolvedAt: new Date("2026-06-01"),
        updatedAt: new Date("2026-06-01"),
      },
    });

    const result = sortDecisionsForTimeline([pending, resolved]);

    expect(result.map((d) => d.id)).toEqual(["resolved", "pending"]);
  });

  it("breaks a same-date tie stably by createdAt, most recent first", () => {
    const sameDate = new Date("2026-04-01");
    const first = decision({ id: "first", reviewDate: sameDate, createdAt: new Date("2026-01-01") });
    const second = decision({ id: "second", reviewDate: sameDate, createdAt: new Date("2026-02-01") });

    const result = sortDecisionsForTimeline([first, second]);

    expect(result.map((d) => d.id)).toEqual(["second", "first"]);
  });

  it("does not mutate the input array", () => {
    const a = decision({ id: "a", reviewDate: new Date("2026-01-01") });
    const b = decision({ id: "b", reviewDate: new Date("2026-06-01") });
    const input = [a, b];

    sortDecisionsForTimeline(input);

    expect(input).toEqual([a, b]);
  });
});
