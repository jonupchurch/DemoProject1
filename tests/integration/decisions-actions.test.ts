import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createDecision,
  resolveDecision,
  updateResolution,
  updateDecision,
  deleteDecision,
  SerializedDecision,
} from "@/actions/decisions";
import { listDecisions, getDecision } from "@/lib/decisions";
import { ensureTestUser, mockSessionAs, resetDecisions } from "./setup";

beforeAll(async () => {
  const user = await ensureTestUser();
  mockSessionAs(user.id);
});

afterEach(async () => {
  await resetDecisions();
});

async function createPendingDecision(): Promise<SerializedDecision> {
  const result = await createDecision({
    title: "Lease or buy a car?",
    options: [{ name: "Lease" }, { name: "Buy" }],
    confidence: 70,
    category: "Financial",
    reviewDate: "2026-12-01",
  });
  if (!result.success) throw new Error("Failed to create fixture decision");
  return result.data;
}

describe("createDecision (Server Action)", () => {
  it("persists a valid decision with status Pending and its options", async () => {
    const result = await createDecision({
      title: "Lease or buy a car?",
      options: [
        { name: "Lease", pros: "Lower payment", cons: "Mileage limits" },
        { name: "Buy", pros: "Builds equity" },
      ],
      confidence: 70,
      category: "Financial",
      reviewDate: "2026-12-01",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.status).toBe("Pending");
    expect(result.data.options).toHaveLength(2);
    expect(result.data.options[0].name).toBe("Lease");

    const found = await getDecision(result.data.id);
    expect(found?.title).toBe("Lease or buy a car?");
  });

  it("rejects an invalid input and returns field errors instead of throwing", async () => {
    const result = await createDecision({
      title: "",
      options: [],
      confidence: 999,
      category: "Financial",
      reviewDate: "2026-12-01",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errors.title).toBeDefined();
    expect(result.errors.options).toBeDefined();
    expect(result.errors.confidence).toBeDefined();
  });

  it("returns cost as a plain number, not a Prisma Decimal instance (regression: RSC serialization)", async () => {
    // Next.js throws "Only plain objects can be passed to Client Components"
    // if a Server Action returns a Decimal instance to its Client Component
    // caller — this doesn't surface in a plain Vitest call (no real RSC
    // boundary), so the check has to be explicit rather than relying on a
    // thrown error.
    const result = await createDecision({
      title: "Decision with a real cost",
      options: [{ name: "Option 1" }],
      cost: 250,
      confidence: 60,
      category: "Financial",
      reviewDate: "2026-12-01",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.cost).toBe(250);
    expect(typeof result.data.cost).toBe("number");
  });

  it("accepts a review date in the past (spec.md US1 scenario 3)", async () => {
    const result = await createDecision({
      title: "Should have decided sooner",
      options: [{ name: "Do it" }],
      confidence: 50,
      category: "Other",
      reviewDate: "2020-01-01",
    });

    expect(result.success).toBe(true);
  });
});

describe("listDecisions", () => {
  it("returns all decisions for the current owner", async () => {
    await createDecision({
      title: "Decision A",
      options: [{ name: "Option 1" }],
      confidence: 50,
      category: "Career",
      reviewDate: "2026-11-01",
    });
    await createDecision({
      title: "Decision B",
      options: [{ name: "Option 1" }],
      confidence: 50,
      category: "Health",
      reviewDate: "2026-11-02",
    });

    const decisions = await listDecisions();
    expect(decisions).toHaveLength(2);
    expect(decisions.map((d) => d.title).sort()).toEqual(["Decision A", "Decision B"]);
  });

  it("returns an empty array when no decisions have been logged", async () => {
    const decisions = await listDecisions();
    expect(decisions).toEqual([]);
  });

  it("returns both pending and resolved decisions together (spec.md US3)", async () => {
    const pending = await createPendingDecision();
    const toResolve = await createPendingDecision();
    await resolveDecision(toResolve.id, { verdict: "Right", satisfaction: 5 });

    const decisions = await listDecisions();
    expect(decisions).toHaveLength(2);

    const statuses = decisions.map((d) => d.status).sort();
    expect(statuses).toEqual(["Pending", "Resolved"]);

    const resolved = decisions.find((d) => d.id === toResolve.id);
    expect(resolved?.resolution?.verdict).toBe("Right");

    const stillPending = decisions.find((d) => d.id === pending.id);
    expect(stillPending?.resolution).toBeNull();
  });
});

describe("resolveDecision (Server Action)", () => {
  it("resolves a pending decision, setting status and locking the original entry", async () => {
    const pending = await createPendingDecision();

    const result = await resolveDecision(pending.id, {
      verdict: "Right",
      satisfaction: 4,
      learnings: "Leasing was the right call for our situation.",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.status).toBe("Resolved");
    expect(result.data.resolution?.verdict).toBe("Right");
    expect(result.data.resolution?.satisfaction).toBe(4);
    // Original entry untouched:
    expect(result.data.title).toBe(pending.title);
    expect(result.data.options).toHaveLength(2);
  });

  it("allows resolving before the review date has arrived (spec.md US2 scenario 2)", async () => {
    const result = await createDecision({
      title: "Resolve early",
      options: [{ name: "Do it" }],
      confidence: 80,
      category: "Other",
      reviewDate: "2099-01-01", // far in the future
    });
    if (!result.success) throw new Error("fixture failed");

    const resolved = await resolveDecision(result.data.id, {
      verdict: "Mixed",
      satisfaction: 3,
    });

    expect(resolved.success).toBe(true);
  });

  it("rejects an invalid verdict/satisfaction and returns field errors", async () => {
    const pending = await createPendingDecision();

    // @ts-expect-error intentionally invalid for the test
    const result = await resolveDecision(pending.id, { verdict: "Sideways", satisfaction: 10 });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.verdict).toBeDefined();
    expect(result.errors.satisfaction).toBeDefined();
  });

  it("updates the existing resolution instead of erroring when called again (edge case, spec.md)", async () => {
    const pending = await createPendingDecision();
    await resolveDecision(pending.id, { verdict: "Wrong", satisfaction: 2 });

    const secondCall = await resolveDecision(pending.id, {
      verdict: "Right",
      satisfaction: 5,
      learnings: "Actually it worked out.",
    });

    expect(secondCall.success).toBe(true);
    if (!secondCall.success) return;
    expect(secondCall.data.resolution?.verdict).toBe("Right");
    expect(secondCall.data.resolution?.satisfaction).toBe(5);

    const found = await getDecision(pending.id);
    expect(found?.resolution?.verdict).toBe("Right");
  });
});

describe("updateResolution (Server Action)", () => {
  it("corrects an already-resolved decision's verdict/satisfaction/learnings", async () => {
    const pending = await createPendingDecision();
    await resolveDecision(pending.id, { verdict: "Wrong", satisfaction: 2, learnings: "Oops" });

    const result = await updateResolution(pending.id, {
      verdict: "Mixed",
      satisfaction: 3,
      learnings: "On reflection, it was a mixed outcome.",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.resolution?.verdict).toBe("Mixed");
    expect(result.data.resolution?.satisfaction).toBe(3);
    expect(result.data.resolution?.learnings).toBe("On reflection, it was a mixed outcome.");
    // Original entry still untouched by editing the resolution:
    expect(result.data.title).toBe(pending.title);
  });

  it("returns an error when the decision has not been resolved yet", async () => {
    const pending = await createPendingDecision();

    const result = await updateResolution(pending.id, { verdict: "Right", satisfaction: 5 });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors._root).toBeDefined();
  });
});

describe("updateDecision (Server Action)", () => {
  it("edits a pending decision's original entry", async () => {
    const pending = await createPendingDecision();

    const result = await updateDecision(pending.id, {
      title: "Lease or buy a car? (updated)",
      options: [{ name: "Lease", pros: "Lower payment" }],
      confidence: 80,
      category: "Financial",
      reviewDate: "2027-01-01",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.title).toBe("Lease or buy a car? (updated)");
    expect(result.data.options).toHaveLength(1);
    expect(result.data.confidence).toBe(80);
  });

  it("rejects editing a decision that has already been resolved (FR-009)", async () => {
    const pending = await createPendingDecision();
    await resolveDecision(pending.id, { verdict: "Right", satisfaction: 4 });

    const result = await updateDecision(pending.id, {
      title: "Trying to sneak an edit in",
      options: [{ name: "Lease" }],
      confidence: 90,
      category: "Financial",
      reviewDate: "2027-01-01",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors._root).toBeDefined();

    const found = await getDecision(pending.id);
    expect(found?.title).toBe(pending.title);
  });

  it("rejects removing every option, leaving none (FR-016 edge case)", async () => {
    const pending = await createPendingDecision();

    const result = await updateDecision(pending.id, {
      title: pending.title,
      options: [],
      confidence: pending.confidence,
      category: pending.category,
      reviewDate: "2026-12-01",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.options).toBeDefined();
  });
});

describe("deleteDecision (Server Action)", () => {
  it("deletes a pending decision", async () => {
    const pending = await createPendingDecision();

    await deleteDecision(pending.id);

    const found = await getDecision(pending.id);
    expect(found).toBeNull();
  });

  it("deletes a resolved decision along with its resolution", async () => {
    const pending = await createPendingDecision();
    await resolveDecision(pending.id, { verdict: "Right", satisfaction: 4 });

    await deleteDecision(pending.id);

    const found = await getDecision(pending.id);
    expect(found).toBeNull();
  });
});
