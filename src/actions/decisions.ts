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

export async function createDecision(
  input: CreateDecisionInput,
): Promise<ActionResult<DecisionWithDetails>> {
  try {
    const decision = await createDecisionRecord(input);
    revalidatePath("/decisions");
    return { success: true, data: decision };
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
): Promise<ActionResult<DecisionWithDetails>> {
  try {
    const decision = await resolveDecisionRecord(id, input);
    revalidatePath("/decisions");
    revalidatePath(`/decisions/${id}`);
    return { success: true, data: decision };
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
): Promise<ActionResult<DecisionWithDetails>> {
  try {
    const decision = await updateResolutionRecord(decisionId, input);
    revalidatePath("/decisions");
    revalidatePath(`/decisions/${decisionId}`);
    return { success: true, data: decision };
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
): Promise<ActionResult<DecisionWithDetails>> {
  try {
    const decision = await updateDecisionRecord(id, input);
    revalidatePath("/decisions");
    revalidatePath(`/decisions/${id}`);
    return { success: true, data: decision };
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
