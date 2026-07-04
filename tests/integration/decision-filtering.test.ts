import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createDecision, resolveDecision } from "@/actions/decisions";
import { listDecisions, countDecisions } from "@/lib/decisions";
import { ensureTestUser, mockSessionAs, resetDecisions } from "./setup";

let userId: string;
let otherUserId: string;

beforeAll(async () => {
  const user = await ensureTestUser("filter-user@example.com");
  const other = await ensureTestUser("filter-other-user@example.com");
  userId = user.id;
  otherUserId = other.id;
});

afterEach(async () => {
  await resetDecisions();
});

async function seed() {
  mockSessionAs(userId);

  const financial = await createDecision({
    title: "Lease or buy a car?",
    options: [{ name: "Lease" }],
    confidence: 60,
    category: "Financial",
    reviewDate: "2026-12-01",
  });
  if (!financial.success) throw new Error("fixture failed");

  const career = await createDecision({
    title: "Take the new job offer?",
    options: [{ name: "Accept" }],
    confidence: 70,
    category: "Career",
    reviewDate: "2026-12-01",
  });
  if (!career.success) throw new Error("fixture failed");
  await resolveDecision(career.data.id, { verdict: "Right", satisfaction: 5 });

  const health = await createDecision({
    title: "Start a new workout routine?",
    options: [{ name: "Start" }],
    confidence: 40,
    category: "Health",
    reviewDate: "2026-12-01",
  });
  if (!health.success) throw new Error("fixture failed");
  await resolveDecision(health.data.id, { verdict: "Wrong", satisfaction: 2 });

  return { financial: financial.data, career: career.data, health: health.data };
}

describe("listDecisions(filters) - category/status/verdict (spec.md US1)", () => {
  it("filters by a single category (FR-001)", async () => {
    const fixtures = await seed();

    const result = await listDecisions({ categories: ["Financial"], statuses: [], verdicts: [] });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(fixtures.financial.id);
  });

  it("filters by a single status (FR-002)", async () => {
    await seed();

    const result = await listDecisions({ categories: [], statuses: ["Pending"], verdicts: [] });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("Pending");
  });

  it("filters by verdict, excluding Pending decisions entirely (FR-003)", async () => {
    const fixtures = await seed();

    const result = await listDecisions({ categories: [], statuses: [], verdicts: ["Right"] });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(fixtures.career.id);
  });

  it("combines category and status filters (FR-004)", async () => {
    const fixtures = await seed();

    const result = await listDecisions({
      categories: ["Career", "Health"],
      statuses: ["Resolved"],
      verdicts: [],
    });

    expect(result.map((d) => d.id).sort()).toEqual(
      [fixtures.career.id, fixtures.health.id].sort(),
    );
  });

  it("is unaffected by ownership scoping — never returns another account's decisions", async () => {
    await seed();

    mockSessionAs(otherUserId);
    const result = await listDecisions({ categories: ["Financial"], statuses: [], verdicts: [] });
    expect(result).toEqual([]);
  });

  it("behaves exactly like the unfiltered call when filters are all empty", async () => {
    await seed();

    const unfiltered = await listDecisions();
    const explicitlyEmpty = await listDecisions({ categories: [], statuses: [], verdicts: [] });

    expect(explicitlyEmpty).toHaveLength(unfiltered.length);
  });
});

describe("listDecisions(filters) - search (spec.md US2)", () => {
  async function seedSearchable() {
    mockSessionAs(userId);

    const byTitle = await createDecision({
      title: "Zebracorn relocation plan",
      options: [{ name: "Option 1" }],
      confidence: 50,
      category: "Other",
      reviewDate: "2026-12-01",
    });
    if (!byTitle.success) throw new Error("fixture failed");

    const byRisks = await createDecision({
      title: "Unrelated decision A",
      options: [{ name: "Option 1" }],
      risks: "Might trigger a flurbington shortage",
      confidence: 50,
      category: "Other",
      reviewDate: "2026-12-01",
    });
    if (!byRisks.success) throw new Error("fixture failed");

    const byNotes = await createDecision({
      title: "Unrelated decision B",
      options: [{ name: "Option 1" }],
      notes: "Discussed with a quibberjack consultant",
      confidence: 50,
      category: "Other",
      reviewDate: "2026-12-01",
    });
    if (!byNotes.success) throw new Error("fixture failed");

    const byLearnings = await createDecision({
      title: "Unrelated decision C",
      options: [{ name: "Option 1" }],
      confidence: 50,
      category: "Financial",
      reviewDate: "2026-12-01",
    });
    if (!byLearnings.success) throw new Error("fixture failed");
    await resolveDecision(byLearnings.data.id, {
      verdict: "Right",
      satisfaction: 5,
      learnings: "Should have consulted a woggledorf sooner",
    });

    return { byTitle: byTitle.data, byRisks: byRisks.data, byNotes: byNotes.data, byLearnings: byLearnings.data };
  }

  it("finds a decision by a term unique to its title", async () => {
    const fixtures = await seedSearchable();
    const result = await listDecisions({ categories: [], statuses: [], verdicts: [], search: "zebracorn" });
    expect(result.map((d) => d.id)).toEqual([fixtures.byTitle.id]);
  });

  it("finds a decision by a term unique to its risks", async () => {
    const fixtures = await seedSearchable();
    const result = await listDecisions({ categories: [], statuses: [], verdicts: [], search: "flurbington" });
    expect(result.map((d) => d.id)).toEqual([fixtures.byRisks.id]);
  });

  it("finds a decision by a term unique to its notes", async () => {
    const fixtures = await seedSearchable();
    const result = await listDecisions({ categories: [], statuses: [], verdicts: [], search: "quibberjack" });
    expect(result.map((d) => d.id)).toEqual([fixtures.byNotes.id]);
  });

  it("finds a resolved decision by a term unique to its learnings", async () => {
    const fixtures = await seedSearchable();
    const result = await listDecisions({ categories: [], statuses: [], verdicts: [], search: "woggledorf" });
    expect(result.map((d) => d.id)).toEqual([fixtures.byLearnings.id]);
  });

  it("combines search with an active category filter (FR-007)", async () => {
    const fixtures = await seedSearchable();
    const result = await listDecisions({
      categories: ["Financial"],
      statuses: [],
      verdicts: [],
      search: "woggledorf",
    });
    expect(result.map((d) => d.id)).toEqual([fixtures.byLearnings.id]);

    const noMatch = await listDecisions({
      categories: ["Health"],
      statuses: [],
      verdicts: [],
      search: "woggledorf",
    });
    expect(noMatch).toEqual([]);
  });

  it("returns an empty array for a term that matches nothing", async () => {
    await seedSearchable();
    const result = await listDecisions({
      categories: [],
      statuses: [],
      verdicts: [],
      search: "nonexistentgibberish",
    });
    expect(result).toEqual([]);
  });
});

describe("countDecisions (spec.md FR-008)", () => {
  it("returns the total unfiltered count for the current owner", async () => {
    await seed();
    expect(await countDecisions()).toBe(3);
  });

  it("returns 0 when the owner has no decisions", async () => {
    expect(await countDecisions()).toBe(0);
  });
});
