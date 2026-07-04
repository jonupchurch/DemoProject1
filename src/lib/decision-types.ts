import type { Category, Verdict } from "@prisma/client";

// Client-safe: no Prisma runtime import here. Client Components (e.g.
// decision-form.tsx) must import from this module, never from
// src/lib/decisions.ts, which pulls in the Prisma client / `pg` driver.
export const CATEGORIES: Category[] = [
  "Financial",
  "Career",
  "Relationships",
  "Health",
  "Housing",
  "Other",
];

export interface OptionInput {
  name: string;
  pros?: string;
  cons?: string;
}

export interface CreateDecisionInput {
  title: string;
  options: OptionInput[];
  cost?: number;
  risks?: string;
  notes?: string;
  confidence: number;
  category: Category;
  reviewDate: string; // ISO date
}

export const VERDICTS: Verdict[] = ["Right", "Wrong", "Mixed"];

export interface ResolveInput {
  verdict: Verdict;
  satisfaction: number;
  learnings?: string;
}
