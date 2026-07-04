import type { CalibrationBucket } from "@/lib/calibration";

// The accessible source of truth for calibration data (research.md §2) —
// Recharts' SVG output isn't reliably screen-reader friendly on its own, so
// this table carries the same figures independently of the chart.
function BucketTable({
  caption,
  labelHeader,
  rows,
}: {
  caption: string;
  labelHeader: string;
  rows: CalibrationBucket[];
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="mb-2 text-left font-medium text-gray-900 dark:text-gray-100">{caption}</caption>
      <thead>
        <tr className="border-b border-gray-300 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
          <th scope="col" className="py-2 pr-4 font-medium">
            {labelHeader}
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Accuracy
          </th>
          <th scope="col" className="py-2 font-medium">
            Decisions
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-gray-200 dark:border-gray-800">
            <td className="py-2 pr-4">{row.label}</td>
            <td className="py-2 pr-4">{Math.round(row.accuracyRate * 100)}%</td>
            <td className="py-2">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CalibrationTable({
  byBand,
  byCategory,
}: {
  byBand: CalibrationBucket[];
  byCategory: CalibrationBucket[];
}) {
  return (
    <div className="mb-8 flex flex-col gap-8">
      <BucketTable
        caption="By confidence level"
        labelHeader="Confidence"
        rows={byBand}
      />
      <BucketTable caption="By category" labelHeader="Category" rows={byCategory} />
    </div>
  );
}
