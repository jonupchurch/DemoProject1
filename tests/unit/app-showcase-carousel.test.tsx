import { describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  AppShowcaseCarousel,
  type AppShowcaseSlide,
} from "@/components/home/app-showcase-carousel";

vi.mock("embla-carousel-react", () => {
  const listeners: Record<string, (() => void)[]> = {};
  let selected = 0;

  const api = {
    selectedScrollSnap: () => selected,
    on: (event: string, cb: () => void) => {
      (listeners[event] ??= []).push(cb);
    },
    off: (event: string, cb: () => void) => {
      listeners[event] = (listeners[event] ?? []).filter((fn) => fn !== cb);
    },
    scrollPrev: vi.fn(() => {
      selected = Math.max(0, selected - 1);
      listeners["select"]?.forEach((fn) => fn());
    }),
    scrollNext: vi.fn(() => {
      selected += 1;
      listeners["select"]?.forEach((fn) => fn());
    }),
    scrollTo: vi.fn((index: number) => {
      selected = index;
      listeners["select"]?.forEach((fn) => fn());
    }),
  };

  return {
    default: () => [vi.fn(), api],
    __resetMockSelected: () => {
      selected = 0;
    },
  };
});

function oneApp(): AppShowcaseSlide[] {
  return [
    {
      id: "app-1",
      title: "App One",
      subtitle: "Subtitle one",
      features: [{ title: "Feature A", body: "Body A" }],
    },
  ];
}

function twoApps(): AppShowcaseSlide[] {
  return [
    ...oneApp(),
    {
      id: "app-2",
      title: "App Two",
      subtitle: "Subtitle two",
      features: [{ title: "Feature B", body: "Body B" }],
    },
  ];
}

describe("AppShowcaseCarousel", () => {
  it("hides prev/next arrows and dots with only one slide", () => {
    render(<AppShowcaseCarousel apps={oneApp()} />);
    expect(screen.queryByRole("button", { name: "Previous app" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next app" })).not.toBeInTheDocument();
    expect(screen.getByText("Feature A")).toBeInTheDocument();
  });

  it("shows prev/next arrows and one dot per app with multiple slides", () => {
    render(<AppShowcaseCarousel apps={twoApps()} />);
    expect(screen.getByRole("button", { name: "Previous app" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next app" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show App One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show App Two" })).toBeInTheDocument();
  });

  it("swaps the displayed feature cards after clicking next (post fade-out delay)", async () => {
    vi.useFakeTimers();
    render(<AppShowcaseCarousel apps={twoApps()} />);
    expect(screen.getByText("Feature A")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Next app" }).click();
    });
    // Still showing the old slide's features during the fade-out window.
    expect(screen.getByText("Feature A")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText("Feature B")).toBeInTheDocument();
    expect(screen.queryByText("Feature A")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
