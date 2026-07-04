import "server-only";
import type { Category, Verdict } from "@prisma/client";
import { prisma } from "@/lib/db";

interface StarterOption {
  name: string;
  pros?: string;
  cons?: string;
}

interface StarterResolution {
  verdict: Verdict;
  satisfaction: number;
  learnings?: string;
  resolvedAt: string; // ISO date
}

interface StarterDecision {
  title: string;
  options: StarterOption[];
  cost?: number;
  risks?: string;
  notes?: string;
  confidence: number;
  category: Category;
  reviewDate: string; // ISO date
  resolution?: StarterResolution;
}

/**
 * Same fixed set for every new user (not randomized/personalized) — the goal
 * is just to make a brand-new account's list/timeline/dashboard non-empty.
 * Spans every confidence band (0-20 through 81-100) and every category
 * exactly once among the five resolved entries, with verdicts that aren't
 * perfectly monotonic with confidence, so the calibration dashboard shows an
 * actual curve rather than a flat line.
 */
const STARTER_DECISIONS: StarterDecision[] = [
  {
    title: "Accept the senior engineer offer at Northwind Robotics",
    options: [
      {
        name: "Accept the offer",
        pros: "20% pay increase, larger scope, remote-friendly team",
        cons: "Unproven manager, longer commute on office days",
      },
      {
        name: "Stay and negotiate",
        pros: "Known team, no transition risk",
        cons: "Counteroffer might not materialize",
      },
    ],
    confidence: 88,
    category: "Career",
    reviewDate: "2026-03-01",
    risks: "New manager's reputation is unclear; could be a step down in day-to-day happiness even with more money.",
    notes: "Referral from a former teammate who's been there 2 years and likes it.",
    resolution: {
      verdict: "Right",
      satisfaction: 5,
      learnings: "The scope and pay increase were worth the adjustment period. Should trust strong referrals more.",
      resolvedAt: "2026-04-05",
    },
  },
  {
    title: "Move into the 2-bedroom apartment near downtown",
    options: [
      {
        name: "Sign the downtown lease",
        pros: "10-minute walk to work, more space",
        cons: "$300/month more than current place",
      },
      {
        name: "Renew current lease",
        pros: "Cheaper, no moving hassle",
        cons: "Long commute continues",
      },
    ],
    cost: 300,
    confidence: 63,
    category: "Housing",
    reviewDate: "2026-03-20",
    risks: "Rent increase eats into savings goal for the year.",
    resolution: {
      verdict: "Mixed",
      satisfaction: 3,
      learnings: "Loved the location, but the extra rent strained the budget more than expected.",
      resolvedAt: "2026-04-25",
    },
  },
  {
    title: "Refinance the car loan to a lower rate",
    options: [
      {
        name: "Refinance with the credit union",
        pros: "1.5% lower rate",
        cons: "$200 processing fee",
      },
      { name: "Keep the current loan", pros: "No paperwork", cons: "Higher rate for remaining term" },
    ],
    cost: 200,
    confidence: 52,
    category: "Financial",
    reviewDate: "2026-04-10",
    risks: "Rate environment could shift before the refinance closes.",
    resolution: {
      verdict: "Wrong",
      satisfaction: 2,
      learnings: "The rate dropped further two weeks after refinancing — should have waited.",
      resolvedAt: "2026-05-01",
    },
  },
  {
    title: "Start training for the fall half-marathon",
    options: [
      {
        name: "Sign up and follow a 12-week plan",
        pros: "Clear goal, accountability",
        cons: "5 hours/week time commitment",
      },
      { name: "Keep casual running routine", pros: "Flexible, low pressure", cons: "No race-day motivation" },
    ],
    confidence: 28,
    category: "Health",
    reviewDate: "2026-04-28",
    risks: "History of knee issues under higher mileage.",
    resolution: {
      verdict: "Wrong",
      satisfaction: 2,
      learnings: "Knee pain flared up at week 6 and derailed the plan — should have built mileage more gradually.",
      resolvedAt: "2026-05-20",
    },
  },
  {
    title: "Have the honest conversation with Sam about the business partnership",
    options: [
      {
        name: "Raise the concerns directly",
        pros: "Clears the air, respects the friendship",
        cons: "Risk of an uncomfortable conversation",
      },
      { name: "Let it go and hope it improves", pros: "Avoids short-term conflict", cons: "Resentment likely builds" },
    ],
    confidence: 18,
    category: "Relationships",
    reviewDate: "2026-05-15",
    risks: "Could strain the friendship if Sam gets defensive.",
    resolution: {
      verdict: "Right",
      satisfaction: 4,
      learnings: "Sam appreciated the directness more than expected — waiting would have made it worse.",
      resolvedAt: "2026-05-29",
    },
  },
  {
    title: "Switch to a new bank for the higher-yield savings account",
    options: [
      {
        name: "Open the new high-yield account",
        pros: "4.5% APY vs 0.5% currently",
        cons: "New login, need to update autopay links",
      },
      { name: "Stay put", pros: "No transition work", cons: "Leaving meaningful interest on the table" },
    ],
    confidence: 60,
    category: "Other",
    reviewDate: "2026-07-25",
    risks: "New bank's mobile app has mixed reviews.",
    // No resolution — stays Pending, with a review date still in the future.
  },
];

/**
 * Called once, right after a brand-new User row is created (see
 * `events.createUser` in src/auth.ts) — gives a first-time sign-in something
 * to look at immediately instead of every list/dashboard/timeline being
 * empty.
 */
export async function seedStarterDecisions(ownerId: string): Promise<void> {
  await prisma.$transaction(
    STARTER_DECISIONS.map((decision) =>
      prisma.decision.create({
        data: {
          ownerId,
          title: decision.title,
          cost: decision.cost,
          risks: decision.risks,
          notes: decision.notes,
          confidence: decision.confidence,
          category: decision.category,
          reviewDate: new Date(decision.reviewDate),
          status: decision.resolution ? "Resolved" : "Pending",
          options: {
            create: decision.options.map((option, index) => ({
              name: option.name,
              pros: option.pros,
              cons: option.cons,
              sortOrder: index,
            })),
          },
          ...(decision.resolution && {
            resolution: {
              create: {
                verdict: decision.resolution.verdict,
                satisfaction: decision.resolution.satisfaction,
                learnings: decision.resolution.learnings,
                resolvedAt: new Date(decision.resolution.resolvedAt),
              },
            },
          }),
        },
      }),
    ),
  );
}
