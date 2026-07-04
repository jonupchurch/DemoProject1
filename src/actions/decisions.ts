"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createDecision as createDecisionRecord,
  resolveDecision as resolveDecisionRecord,
  updateResolution as updateResolutionRecord,
  updateDecision as updateDecisionRecord,
  deleteDecision as deleteDecisionRecord,
  CreateDecisionInput,
  DecisionWithDetails,
  ResolveInput,
  ValidationError,
  NotFoundError,
} from "@/lib/decisions";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

// Prisma's `Decimal` (Decision.cost) is a class instance, not a plain object —
// Next.js refuses to serialize it across the Server Action -> Client Component
// boundary ("Only plain objects can be passed to Client Components..."). The
// DB write itself always succeeds regardless; only the *response* back to the
// calling Client Component was breaking. lib/decisions.ts's own return type is
// left as-is (Server Components reading it directly, e.g. the decision detail
// page, never cross that boundary), so the conversion happens only here, at
// the actual Client/Server edge.
export type SerializedDecision = Omit<DecisionWithDetails, "cost"> & {
  cost: number | null;
};

function serializeDecision(decision: DecisionWithDetails): SerializedDecision {
  return { ...decision, cost: decision.cost != null ? Number(decision.cost) : null };
}

export async function createDecision(
  input: CreateDecisionInput,
): Promise<ActionResult<SerializedDecision>> {
  try {
    const decision = await createDecisionRecord(input);
    revalidatePath("/decisions");
    return { success: true, data: serializeDecision(decision) };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    throw error;
  }
}

export async function resolveDecision(
  id: string,
  input: ResolveInput,
): Promise<ActionResult<SerializedDecision>> {
  try {
    const decision = await resolveDecisionRecord(id, input);
    revalidatePath("/decisions");
    revalidatePath(`/decisions/${id}`);
    return { success: true, data: serializeDecision(decision) };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    if (error instanceof NotFoundError) {
      return { success: false, errors: { _root: error.message } };
    }
    throw error;
  }
}

export async function updateResolution(
  decisionId: string,
  input: ResolveInput,
): Promise<ActionResult<SerializedDecision>> {
  try {
    const decision = await updateResolutionRecord(decisionId, input);
    revalidatePath("/decisions");
    revalidatePath(`/decisions/${decisionId}`);
    return { success: true, data: serializeDecision(decision) };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    if (error instanceof NotFoundError) {
      return { success: false, errors: { _root: error.message } };
    }
    throw error;
  }
}

export async function updateDecision(
  id: string,
  input: CreateDecisionInput,
): Promise<ActionResult<SerializedDecision>> {
  try {
    const decision = await updateDecisionRecord(id, input);
    revalidatePath("/decisions");
    revalidatePath(`/decisions/${id}`);
    return { success: true, data: serializeDecision(decision) };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    if (error instanceof NotFoundError) {
      return { success: false, errors: { _root: error.message } };
    }
    throw error;
  }
}

export async function deleteDecision(id: string): Promise<void> {
  await deleteDecisionRecord(id);
  revalidatePath("/decisions");
  redirect("/decisions");
}
