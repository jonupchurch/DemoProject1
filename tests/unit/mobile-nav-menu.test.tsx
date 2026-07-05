import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { MobileNavMenu } from "@/components/nav/mobile-nav-menu";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("MobileNavMenu", () => {
  it("is closed by default and opens the nav panel when the hamburger is clicked", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<MobileNavMenu isSignedIn={false} />);

    expect(screen.queryByText("Home")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<MobileNavMenu isSignedIn={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("Home")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("closes when clicking outside", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<MobileNavMenu isSignedIn={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("Home")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("closes the panel after navigating via a plain link", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<MobileNavMenu isSignedIn={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByText("About"));

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("shows Decisions and Contact when signed in", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<MobileNavMenu isSignedIn={true} />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("button", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });
});
