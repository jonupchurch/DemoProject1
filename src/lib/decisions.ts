import "server-only";
import { Decision, Option, Resolution } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/session";
import {
  CATEGORIES,
  CreateDecisionInput,
  VERDICTS,
  ResolveInput,
} from "@/lib/decision-types";
import type { ResolvedDecisionForCalibration } from "@/lib/calibration";

export { CATEGORIES, VERDICTS } from "@/lib/decision-types";
export type {
  CreateDecisionInput,
  OptionInput,
  ResolveInput,
} from "@/lib/decision-types";

export type DecisionWithDetails = Decision & {
  options: Option[];
  resolution: Resolution | null;
};

export class ValidationError extends Error {
  constructor(public fieldErrors: Record<string, string>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Decision not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** FR-007, FR-014: satisfaction 1-5, verdict one of Right/Wrong/Mixed. */
export function validateResolveInput(input: ResolveInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.verdict || !VERDICTS.includes(input.verdict)) {
    errors.verdict = "A valid verdict is required.";
  }

  if (
    input.satisfaction === undefined ||
    input.satisfaction === null ||
    !Number.isInteger(input.satisfaction) ||
    input.satisfaction < 1 ||
    input.satisfaction > 5
  ) {
    errors.satisfaction = "Satisfaction must be a whole number between 1 and 5.";
  }

  return errors;
}

/**
 * Pure validation, independent of the database — FR-002, FR-013.
 * Returns a map of field name -> error message; empty means valid.
 */
export function validateCreateDecisionInput(
  input: CreateDecisionInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.title || !input.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!input.options || input.options.length < 1) {
    errors.options = "At least one option is required.";
  } else {
    input.options.forEach((option, index) => {
      if (!option.name || !option.name.trim()) {
        errors[`options.${index}.name`] = "Option name is required.";
      }
    });
  }

  if (
    input.confidence === undefined ||
    input.confidence === null ||
    !Number.isInteger(input.confidence) ||
    input.confidence < 0 ||
    input.confidence > 100
  ) {
    errors.confidence = "Confidence must be a whole number between 0 and 100.";
  }

  if (!input.category || !CATEGORIES.includes(input.category)) {
    errors.category = "A valid category is required.";
  }

  if (!input.reviewDate || Number.isNaN(Date.parse(input.reviewDate))) {
    errors.reviewDate = "A valid review date is required.";
  }

  return errors;
}

export async function createDecision(
  input: CreateDecisionInput,
): Promise<DecisionWithDetails> {
  const errors = validateCreateDecisionInput(input);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  const ownerId = await requireCurrentUserId();

  return prisma.decision.create({
    data: {
      ownerId,
      title: input.title.trim(),
      cost: input.cost,
      risks: input.risks,
      notes: input.notes,
      confidence: input.confidence,
      category: input.category,
      reviewDate: new Date(input.reviewDate),
      options: {
        create: input.options.map((option, index) => ({
          name: option.name.trim(),
          pros: option.pros,
          cons: option.cons,
          sortOrder: index,
        })),
      },
    },
    include: { options: { orderBy: { sortOrder: "asc" } }, resolution: true },
  });
}

/** FR-004: all decisions for the current owner, regardless of status. */
export async function listDecisions(): Promise<DecisionWithDetails[]> {
  const ownerId = await requireCurrentUserId();

  return prisma.decision.findMany({
    where: { ownerId },
    include: { options: { orderBy: { sortOrder: "asc" } }, resolution: true },
    orderBy: [{ reviewDate: "asc" }, { createdAt: "desc" }],
  });
}

/** FR-005: full detail for one decision belonging to the current owner. */
export async function getDecision(
  id: string,
): Promise<DecisionWithDetails | null> {
  const ownerId = await requireCurrentUserId();

  return prisma.decision.findFirst({
    where: { id, ownerId },
    include: { options: { orderBy: { sortOrder: "asc" } }, resolution: true },
  });
}

/**
 * FR-007, FR-008: resolve a pending decision. If it's already resolved
 * (e.g. a stale UI/duplicate submit), updates the existing resolution
 * instead of erroring or creating a second one (spec.md edge case).
 */
export async function resolveDecision(
  id: string,
  input: ResolveInput,
): Promise<DecisionWithDetails> {
  const errors = validateResolveInput(input);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  const ownerId = await requireCurrentUserId();
  const decision = await prisma.decision.findFirst({ where: { id, ownerId } });
  if (!decision) {
    throw new NotFoundError();
  }

  await prisma.decision.update({
    where: { id },
    data: {
      status: "Resolved",
      resolution: {
        upsert: {
          create: {
            verdict: input.verdict,
            satisfaction: input.satisfaction,
            learnings: input.learnings,
          },
          update: {
            verdict: input.verdict,
            satisfaction: input.satisfaction,
            learnings: input.learnings,
          },
        },
      },
    },
  });

  return getDecision(id) as Promise<DecisionWithDetails>;
}

/** FR-010: correct an already-resolved decision's verdict/satisfaction/learnings. */
export async function updateResolution(
  decisionId: string,
  input: ResolveInput,
): Promise<DecisionWithDetails> {
  const errors = validateResolveInput(input);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  const ownerId = await requireCurrentUserId();
  const decision = await prisma.decision.findFirst({
    where: { id: decisionId, ownerId },
    include: { resolution: true },
  });
  if (!decision) {
    throw new NotFoundError();
  }
  if (!decision.resolution) {
    throw new NotFoundError(
      "This decision has not been resolved yet; use resolveDecision instead.",
    );
  }

  await prisma.resolution.update({
    where: { decisionId },
    data: {
      verdict: input.verdict,
      satisfaction: input.satisfaction,
      learnings: input.learnings,
    },
  });

  return getDecision(decisionId) as Promise<DecisionWithDetails>;
}

/**
 * FR-009, FR-011, FR-016: edit a still-pending decision's original entry,
 * including adding/removing options (at least one must remain). Rejects if
 * the decision has already been resolved.
 */
export async function updateDecision(
  id: string,
  input: CreateDecisionInput,
): Promise<DecisionWithDetails> {
  const errors = validateCreateDecisionInput(input);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  const ownerId = await requireCurrentUserId();
  const decision = await prisma.decision.findFirst({ where: { id, ownerId } });
  if (!decision) {
    throw new NotFoundError();
  }
  if (decision.status !== "Pending") {
    throw new ValidationError({
      _root: "This decision has been resolved and its original entry is locked.",
    });
  }

  await prisma.decision.update({
    where: { id },
    data: {
      title: input.title.trim(),
      cost: input.cost,
      risks: input.risks,
      notes: input.notes,
      confidence: input.confidence,
      category: input.category,
      reviewDate: new Date(input.reviewDate),
      options: {
        deleteMany: {},
        create: input.options.map((option, index) => ({
          name: option.name.trim(),
          pros: option.pros,
          cons: option.cons,
          sortOrder: index,
        })),
      },
    },
  });

  return getDecision(id) as Promise<DecisionWithDetails>;
}

/**
 * Phase 3 FR-002/FR-009: only the current owner's Resolved decisions, with just the fields
 * the calibration dashboard's aggregation needs (no options — see data-model.md).
 */
export async function listResolvedDecisionsForCalibration(): Promise<
  ResolvedDecisionForCalibration[]
> {
  const ownerId = await requireCurrentUserId();

  const decisions = await prisma.decision.findMany({
    where: { ownerId, status: "Resolved" },
    select: {
      confidence: true,
      category: true,
      resolution: { select: { verdict: true, satisfaction: true } },
    },
  });

  return decisions
    .filter((decision) => decision.resolution !== null)
    .map((decision) => ({
      confidence: decision.confidence,
      category: decision.category,
      verdict: decision.resolution!.verdict,
      satisfaction: decision.resolution!.satisfaction,
    }));
}

/** FR-012: delete a decision (and its options/resolution) regardless of status. */
export async function deleteDecision(id: string): Promise<void> {
  const ownerId = await requireCurrentUserId();
  await prisma.decision.deleteMany({ where: { id, ownerId } });
}
