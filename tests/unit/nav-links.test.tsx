import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { NavLinks } from "@/components/nav/nav-links";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("NavLinks", () => {
  it("marks Home as active on /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<NavLinks />);
    expect(screen.getByText("Home")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("About")).not.toHaveAttribute("aria-current");
  });

  it("marks Decisions as active on nested decision routes", () => {
    vi.mocked(usePathname).mockReturnValue("/decisions/abc-123");
    render(<NavLinks />);
    expect(screen.getByText("Decisions")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Home")).not.toHaveAttribute("aria-current");
  });

  it("marks About as active on /about", () => {
    vi.mocked(usePathname).mockReturnValue("/about");
    render(<NavLinks />);
    expect(screen.getByText("About")).toHaveAttribute("aria-current", "page");
  });
});
