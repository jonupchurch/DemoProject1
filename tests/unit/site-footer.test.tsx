import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@/components/nav/site-footer";

describe("SiteFooter", () => {
  it("shows a copyright notice with the current year", () => {
    render(<SiteFooter />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("links to the About page", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  });
});
