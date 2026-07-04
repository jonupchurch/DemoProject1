import { requireCurrentUserId } from "@/lib/session";
import { listResolvedDecisionsForCalibration } from "@/lib/decisions";
import { aggregateCalibration } from "@/lib/calibration";
import { CalibrationDashboard } from "@/components/dashboard/calibration-dashboard";

export const metadata = {
  title: "Calibration dashboard — Decision Journal",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Defense in depth (CVE-2025-29927) — same pattern as every other
  // /decisions/* page; DecisionsLayout already enforces this too.
  await requireCurrentUserId();

  const decisions = await listResolvedDecisionsForCalibration();
  const summary = aggregateCalibration(decisions);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Calibration dashboard</h1>
      <CalibrationDashboard {...summary} />
    </main>
  );
}
