import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createDecision, resolveDecision } from "@/actions/decisions";
import { listResolvedDecisionsForCalibration } from "@/lib/decisions";
import { ensureTestUser, mockSessionAs, resetDecisions } from "./setup";

let userAId: string;
let userBId: string;

beforeAll(async () => {
  const userA = await ensureTestUser("calibration-user-a@example.com");
  const userB = await ensureTestUser("calibration-user-b@example.com");
  userAId = userA.id;
  userBId = userB.id;
});

afterEach(async () => {
  await resetDecisions();
});

describe("listResolvedDecisionsForCalibration (spec.md FR-002, FR-009)", () => {
  it("excludes Pending decisions and includes only Resolved ones with their verdict/satisfaction", async () => {
    mockSessionAs(userAId);

    const pending = await createDecision({
      title: "Still deciding",
      options: [{ name: "Option 1" }],
      confidence: 65,
      category: "Career",
      reviewDate: "2026-12-01",
    });
    if (!pending.success) throw new Error("fixture failed");

    const resolved = await createDecision({
      title: "Already resolved",
      options: [{ name: "Option 1" }],
      confidence: 65,
      category: "Career",
      reviewDate: "2026-12-01",
    });
    if (!resolved.success) throw new Error("fixture failed");
    await resolveDecision(resolved.data.id, { verdict: "Right", satisfaction: 5 });

    const result = await listResolvedDecisionsForCalibration();

    expect(result).toEqual([
      { confidence: 65, category: "Career", verdict: "Right", satisfaction: 5 },
    ]);
  });

  it("never returns another account's resolved decisions", async () => {
    mockSessionAs(userAId);
    const userADecision = await createDecision({
      title: "User A's decision",
      options: [{ name: "Option 1" }],
      confidence: 40,
      category: "Health",
      reviewDate: "2026-12-01",
    });
    if (!userADecision.success) throw new Error("fixture failed");
    await resolveDecision(userADecision.data.id, { verdict: "Wrong", satisfaction: 2 });

    mockSessionAs(userBId);
    const userBResult = await listResolvedDecisionsForCalibration();
    expect(userBResult).toEqual([]);

    mockSessionAs(userAId);
    const userAResult = await listResolvedDecisionsForCalibration();
    expect(userAResult).toHaveLength(1);
  });
});
