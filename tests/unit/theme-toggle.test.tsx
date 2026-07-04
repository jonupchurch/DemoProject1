import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/nav/theme-toggle";

afterEach(() => {
  document.documentElement.classList.remove("dark");
  localStorage.clear();
});

describe("ThemeToggle", () => {
  it("reflects the current theme as unchecked when <html> has no dark class", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("reflects the current theme as checked when <html> already has the dark class", () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("shows the moon (switch-to-dark) icon in light mode, not the sun", () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector("circle")).not.toBeInTheDocument();
    expect(container.querySelector("path")).toBeInTheDocument();
  });

  it("shows the sun (switch-to-light) icon in dark mode, not the moon", () => {
    document.documentElement.classList.add("dark");
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector("circle")).toBeInTheDocument();
    expect(container.querySelector("path")).not.toBeInTheDocument();
  });

  it("swaps the icon after clicking", () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector("circle")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch"));

    expect(container.querySelector("circle")).toBeInTheDocument();
  });

  it("switches to dark on click, updating <html> and localStorage", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("switches back to light on a second click", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch");

    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("updates its accessible label to describe the action, not the state", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAccessibleName("Switch to dark mode");

    fireEvent.click(toggle);
    expect(toggle).toHaveAccessibleName("Switch to light mode");
  });
});
