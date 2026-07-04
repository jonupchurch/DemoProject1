import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { SignInMenu } from "@/components/auth/sign-in-menu";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mocked(usePathname).mockReturnValue("/about");

describe("SignInMenu", () => {
  it("opens the popover (revealing the provider buttons) when clicked, and closes on a second click", () => {
    render(<SignInMenu />);

    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with github/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    render(<SignInMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
  });

  it("closes when clicking outside", () => {
    render(<SignInMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
  });

  it("calls signIn with the right provider and the current page as callbackUrl (no redirect to /decisions)", () => {
    render(<SignInMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/about" });
  });
});
