import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { signOut } from "next-auth/react";
import { SignOutButton } from "@/components/auth/sign-out-button";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("SignOutButton", () => {
  it("calls signOut() when clicked", () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });
});
