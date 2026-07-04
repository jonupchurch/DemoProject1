import type { CalibrationSummary } from "@/lib/calibration";
import { CalibrationTable } from "@/components/dashboard/calibration-table";
import { CalibrationChartLazy } from "@/components/dashboard/calibration-chart-lazy";

// FR-008/US3: with nothing resolved yet, show an explanation instead of an
// empty or misleading chart/table.
export function CalibrationDashboard({ byBand, byCategory }: CalibrationSummary) {
  if (byBand.length === 0 && byCategory.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Once you resolve a decision — recording whether it turned out Right, Wrong, or Mixed —
        your calibration will appear here, broken down by confidence level and category.
      </p>
    );
  }

  return (
    <>
      <CalibrationTable byBand={byBand} byCategory={byCategory} />
      <CalibrationChartLazy byBand={byBand} byCategory={byCategory} />
    </>
  );
}
