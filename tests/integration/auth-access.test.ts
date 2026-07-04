import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createDecision } from "@/actions/decisions";
import { listDecisions, getDecision } from "@/lib/decisions";
import { ensureTestUser, mockSessionAs, resetDecisions } from "./setup";

let userAId: string;
let userBId: string;

beforeAll(async () => {
  const userA = await ensureTestUser("user-a@example.com");
  const userB = await ensureTestUser("user-b@example.com");
  userAId = userA.id;
  userBId = userB.id;
});

afterEach(async () => {
  await resetDecisions();
});

describe("cross-account isolation (spec.md US2)", () => {
  it("never returns another account's decisions from listDecisions", async () => {
    mockSessionAs(userAId);
    await createDecision({
      title: "User A's decision",
      options: [{ name: "Option 1" }],
      confidence: 50,
      category: "Other",
      reviewDate: "2026-12-01",
    });

    mockSessionAs(userBId);
    const userBDecisions = await listDecisions();
    expect(userBDecisions).toEqual([]);

    mockSessionAs(userAId);
    const userADecisions = await listDecisions();
    expect(userADecisions).toHaveLength(1);
  });

  it("never returns another account's decision from getDecision, even by direct id", async () => {
    mockSessionAs(userAId);
    const result = await createDecision({
      title: "User A's private decision",
      options: [{ name: "Option 1" }],
      confidence: 50,
      category: "Other",
      reviewDate: "2026-12-01",
    });
    if (!result.success) throw new Error("fixture failed");

    mockSessionAs(userBId);
    const asUserB = await getDecision(result.data.id);
    expect(asUserB).toBeNull();

    mockSessionAs(userAId);
    const asUserA = await getDecision(result.data.id);
    expect(asUserA?.id).toBe(result.data.id);
  });
});
