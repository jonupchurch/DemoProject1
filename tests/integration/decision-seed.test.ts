import { afterEach, describe, expect, it } from "vitest";
import { listDecisions, listResolvedDecisionsForCalibration } from "@/lib/decisions";
import { seedStarterDecisions } from "@/lib/decision-seed";
import { aggregateCalibration, CONFIDENCE_BANDS } from "@/lib/calibration";
import { CATEGORIES } from "@/lib/decision-types";
import { ensureTestUser, mockSessionAs, resetDecisions } from "./setup";

afterEach(async () => {
  await resetDecisions();
});

describe("seedStarterDecisions", () => {
  it("creates six starter decisions spanning every confidence band and category", async () => {
    const user = await ensureTestUser("seed-test@example.com");
    mockSessionAs(user.id);

    await seedStarterDecisions(user.id);

    const decisions = await listDecisions();
    expect(decisions).toHaveLength(6);

    for (const decision of decisions) {
      expect(decision.options.length).toBeGreaterThan(0);
    }

    const resolved = decisions.filter((d) => d.status === "Resolved");
    const pending = decisions.filter((d) => d.status === "Pending");
    expect(resolved).toHaveLength(5);
    expect(pending).toHaveLength(1);

    const categoriesUsed = new Set(decisions.map((d) => d.category));
    expect(categoriesUsed.size).toBe(CATEGORIES.length);

    const forCalibration = await listResolvedDecisionsForCalibration();
    const summary = aggregateCalibration(forCalibration);
    expect(summary.byBand).toHaveLength(CONFIDENCE_BANDS.length);
    expect(summary.byCategory).toHaveLength(5);
  });

  it("is safe to seed two different owners without cross-contaminating their lists", async () => {
    const userA = await ensureTestUser("seed-test-a@example.com");
    const userB = await ensureTestUser("seed-test-b@example.com");

    await seedStarterDecisions(userA.id);
    await seedStarterDecisions(userB.id);

    mockSessionAs(userA.id);
    expect(await listDecisions()).toHaveLength(6);

    mockSessionAs(userB.id);
    expect(await listDecisions()).toHaveLength(6);
  });
});
