import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { NavLinks } from "@/components/nav/nav-links";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("NavLinks", () => {
  it("marks Home as active on /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<NavLinks isSignedIn={false} />);
    expect(screen.getByText("Home")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("About")).not.toHaveAttribute("aria-current");
  });

  it("marks About as active on /about", () => {
    vi.mocked(usePathname).mockReturnValue("/about");
    render(<NavLinks isSignedIn={false} />);
    expect(screen.getByText("About")).toHaveAttribute("aria-current", "page");
  });

  it("hides Decisions and Contact entirely when signed out", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<NavLinks isSignedIn={false} />);
    expect(screen.queryByRole("button", { name: "Decisions" })).not.toBeInTheDocument();
    expect(screen.queryByText("Contact")).not.toBeInTheDocument();
  });

  it("shows Decisions and Contact when signed in", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<NavLinks isSignedIn={true} />);
    expect(screen.getByRole("button", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("highlights the Decisions trigger (but not as aria-current, since it isn't itself a page) on any decisions route", () => {
    vi.mocked(usePathname).mockReturnValue("/decisions/abc-123");
    render(<NavLinks isSignedIn={true} />);
    const trigger = screen.getByRole("button", { name: "Decisions" });
    expect(trigger).toHaveClass("text-brand-600");
    expect(trigger).not.toHaveAttribute("aria-current");
  });

  it("is closed by default and opens the flyout when clicked", () => {
    vi.mocked(usePathname).mockReturnValue("/decisions");
    render(<NavLinks isSignedIn={true} />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Decisions" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "My Decisions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("menuitem", { name: "Timeline" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("menuitem", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("toggles closed on a second click", () => {
    vi.mocked(usePathname).mockReturnValue("/decisions");
    render(<NavLinks isSignedIn={true} />);
    const trigger = screen.getByRole("button", { name: "Decisions" });

    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    vi.mocked(usePathname).mockReturnValue("/decisions");
    render(<NavLinks isSignedIn={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Decisions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when clicking outside", () => {
    vi.mocked(usePathname).mockReturnValue("/decisions");
    render(<NavLinks isSignedIn={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Decisions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows the Travel flyout trigger even when signed out (public, FR-005)", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<NavLinks isSignedIn={false} />);
    expect(screen.getByRole("button", { name: "Travel" })).toBeInTheDocument();
  });

  it("shows Map and List, but not Add a Pin, in the Travel flyout when signed out", () => {
    vi.mocked(usePathname).mockReturnValue("/travel");
    render(<NavLinks isSignedIn={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Travel" }));
    expect(screen.getByRole("menuitem", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "List" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Add a Pin" })).not.toBeInTheDocument();
  });

  it("adds Add a Pin to the Travel flyout when signed in, alongside Map and List", () => {
    vi.mocked(usePathname).mockReturnValue("/travel");
    render(<NavLinks isSignedIn={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Travel" }));
    expect(screen.getByRole("menuitem", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Add a Pin" })).toBeInTheDocument();
  });

  it("opens and closes the Travel flyout independently of the Decisions flyout", () => {
    vi.mocked(usePathname).mockReturnValue("/decisions");
    render(<NavLinks isSignedIn={true} />);

    fireEvent.click(screen.getByRole("button", { name: "Decisions" }));
    expect(screen.getByRole("menu", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.queryByRole("menu", { name: "Travel" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Travel" }));
    expect(screen.getByRole("menu", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "Travel" })).toBeInTheDocument();
  });
});
