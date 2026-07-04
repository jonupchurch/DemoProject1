import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { SignInButtons } from "@/components/auth/sign-in-buttons";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("SignInButtons", () => {
  it("signs in with Google, redirecting back to the current page rather than a fixed route", () => {
    vi.mocked(usePathname).mockReturnValue("/decisions/timeline");
    render(<SignInButtons />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/decisions/timeline" });
  });

  it("signs in with GitHub, redirecting back to the current page rather than a fixed route", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<SignInButtons />);

    fireEvent.click(screen.getByRole("button", { name: /continue with github/i }));
    expect(signIn).toHaveBeenCalledWith("github", { callbackUrl: "/" });
  });
});
