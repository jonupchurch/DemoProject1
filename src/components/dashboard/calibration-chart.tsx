"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CalibrationBucket } from "@/lib/calibration";

// --color-chart-bar (globals.css) — reuses the existing design system rather
// than Recharts' default palette (constitution Principle VI), and adapts to
// dark mode the same way --color-brand-600 does: Tailwind's `dark:` variant
// only rewrites class names, not SVG stroke/fill attributes, so this reads
// the CSS custom property directly instead. This chart is a supplementary
// visualization only; calibration-table.tsx is the accessible source of
// truth for the same data (research.md §2).
const BAR_COLOR = "var(--color-chart-bar)";
const GRID_COLOR = "var(--color-chart-grid)";

function toChartData(rows: CalibrationBucket[]) {
  return rows.map((row) => ({
    label: row.label,
    accuracyPercent: Math.round(row.accuracyRate * 100),
    count: row.count,
  }));
}

function TooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { label: string; accuracyPercent: number; count: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const { label, accuracyPercent, count } = payload[0].payload;
  return (
    <div className="rounded-card border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="font-medium">{label}</p>
      <p className="text-gray-600 dark:text-gray-400">
        {accuracyPercent}% accurate ({count} decision{count === 1 ? "" : "s"})
      </p>
    </div>
  );
}

function BucketBarChart({ title, rows }: { title: string; rows: CalibrationBucket[] }) {
  const data = toChartData(rows);

  return (
    <div className="h-64">
      <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">{title}</p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: GRID_COLOR }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: GRID_COLOR }} />
          <Tooltip content={<TooltipContent />} />
          <Bar dataKey="accuracyPercent" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CalibrationChart({
  byBand,
  byCategory,
}: {
  byBand: CalibrationBucket[];
  byCategory: CalibrationBucket[];
}) {
  // Purely a supplementary visualization of calibration-table.tsx's figures
  // (research.md §2) — inert (not just aria-hidden) rather than left partially
  // labeled, since the table already conveys the same data accessibly. Plain
  // aria-hidden alone would still leave Recharts' internal SVG elements
  // keyboard-focusable, which axe flags (aria-hidden-focus) as a "phantom
  // focus" trap for keyboard/AT users; inert removes both focusability and
  // AT exposure together.
  return (
    <div className="mb-8 flex flex-col gap-8" inert>
      <BucketBarChart title="By confidence level" rows={byBand} />
      <BucketBarChart title="By category" rows={byCategory} />
    </div>
  );
}
