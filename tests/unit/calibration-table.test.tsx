import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalibrationTable } from "@/components/dashboard/calibration-table";

describe("CalibrationTable (spec.md US3, FR-007)", () => {
  it("shows the contributing decision count alongside accuracy even for a single data point", () => {
    render(
      <CalibrationTable
        byBand={[{ label: "61-80", accuracyRate: 1, count: 1 }]}
        byCategory={[]}
      />,
    );

    const row = screen.getByText("61-80").closest("tr");
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent("100%");
    expect(row).toHaveTextContent("1");
  });
});
