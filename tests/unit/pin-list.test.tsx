import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PinList } from "@/components/travel/pin-list";
import type { PinWithPhotos } from "@/lib/travel";

function makePin(overrides: Partial<PinWithPhotos> = {}): PinWithPhotos {
  return {
    id: "pin-1",
    ownerId: "owner-1",
    latitude: 10,
    longitude: 20,
    caption: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    photos: [],
    ...overrides,
  };
}

describe("PinList", () => {
  it("shows an empty-state message when there are no pins", () => {
    render(<PinList pins={[]} />);
    expect(screen.getByText("No pins published yet.")).toBeInTheDocument();
  });

  it("renders a link and coordinates for each pin", () => {
    render(
      <PinList
        pins={[
          makePin({ id: "pin-1", caption: "Sunset in Kyoto" }),
          makePin({ id: "pin-2", latitude: 1, longitude: 2 }),
        ]}
      />,
    );

    const link = screen.getByRole("link", { name: "Sunset in Kyoto" });
    expect(link).toHaveAttribute("href", "/travel/pin-1");

    expect(screen.getByRole("link", { name: "Untitled pin" })).toHaveAttribute(
      "href",
      "/travel/pin-2",
    );
  });

  it("shows the photo count for each pin", () => {
    render(
      <PinList
        pins={[
          makePin({
            photos: [
              { id: "p1", pinId: "pin-1", url: "/x", contentType: "image/jpeg", sortOrder: 0, createdAt: new Date() },
              { id: "p2", pinId: "pin-1", url: "/y", contentType: "image/jpeg", sortOrder: 1, createdAt: new Date() },
            ],
          }),
        ]}
      />,
    );

    expect(screen.getByText(/2 photos/)).toBeInTheDocument();
  });
});
