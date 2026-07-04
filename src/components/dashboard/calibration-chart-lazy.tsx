"use client";

import dynamic from "next/dynamic";
import type { CalibrationBucket } from "@/lib/calibration";

// Recharts is a meaningfully heavy client bundle (research.md §1); loading it
// via next/dynamic keeps it off the critical path for initial hydration so it
// doesn't delay LCP for the page's actual text content (plan.md Constitution
// Check, Principle VII). calibration-table.tsx already renders the same data
// accessibly and immediately, so deferring the chart costs nothing.
const CalibrationChart = dynamic(
  () => import("@/components/dashboard/calibration-chart").then((m) => m.CalibrationChart),
  {
    ssr: false,
    loading: () => (
      <div className="mb-8 flex flex-col gap-8">
        <div className="h-64" />
        <div className="h-64" />
      </div>
    ),
  },
);

export function CalibrationChartLazy(props: {
  byBand: CalibrationBucket[];
  byCategory: CalibrationBucket[];
}) {
  return <CalibrationChart {...props} />;
}
