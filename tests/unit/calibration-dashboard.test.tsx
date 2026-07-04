import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalibrationDashboard } from "@/components/dashboard/calibration-dashboard";

describe("CalibrationDashboard (spec.md US3)", () => {
  it("renders an explanatory empty state instead of a table/chart when nothing is resolved yet (FR-008)", () => {
    render(<CalibrationDashboard byBand={[]} byCategory={[]} />);

    expect(
      screen.getByText(/calibration will appear here/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the table (and omits the empty-state message) once there is calibration data", () => {
    render(
      <CalibrationDashboard
        byBand={[{ label: "61-80", accuracyRate: 0.5, count: 2 }]}
        byCategory={[{ label: "Financial", accuracyRate: 0.5, count: 2 }]}
      />,
    );

    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(
      screen.queryByText(/calibration will appear here/i),
    ).not.toBeInTheDocument();
  });
});
