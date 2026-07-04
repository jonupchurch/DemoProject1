import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserMenu } from "@/components/auth/user-menu";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

// next/image requires a configured loader in a real Next.js runtime; the
// plain-img stub is sufficient for this test's purposes (open/close logic,
// fallback rendering) and avoids needing Next's image optimization pipeline.
vi.mock("next/image", () => ({
  default: (props: React.ComponentProps<"img">) => <img {...props} alt={props.alt ?? ""} />,
}));

describe("UserMenu", () => {
  it("renders a fallback initial when there is no image", () => {
    render(<UserMenu image={null} name="Jon Upchurch" />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders the profile image when provided", () => {
    render(<UserMenu image="https://example.com/avatar.png" name="Jon Upchurch" />);
    const img = document.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("opens the popover (revealing Sign out) when the avatar is clicked, and closes on a second click", () => {
    render(<UserMenu image={null} name="Jon Upchurch" />);

    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    render(<UserMenu image={null} name="Jon Upchurch" />);
    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("closes when clicking outside", () => {
    render(<UserMenu image={null} name="Jon Upchurch" />);
    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });
});
