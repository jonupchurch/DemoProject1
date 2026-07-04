import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TravelMap } from "@/components/travel/travel-map";

const {
  TrackedFakeMap,
  TrackedFakeMarker,
  FakeNavigationControl,
  getLastMap,
  getCreatedMarkers,
  resetCreatedMarkers,
} = vi.hoisted(() => {
  interface FakeMapEvent {
    lngLat: { lng: number; lat: number };
  }

  class FakeMarker {
    element = document.createElement("div");
    addTo() {
      return this;
    }
    setLngLat() {
      return this;
    }
    remove() {}
    getElement() {
      return this.element;
    }
  }

  class FakeMap {
    private listeners: Record<string, ((event: FakeMapEvent) => void)[]> = {};
    addControl() {}
    on(event: string, callback: (event: FakeMapEvent) => void) {
      (this.listeners[event] ??= []).push(callback);
    }
    off(event: string, callback: (event: FakeMapEvent) => void) {
      this.listeners[event] = (this.listeners[event] ?? []).filter((fn) => fn !== callback);
    }
    remove() {}
    __fireClick(event: FakeMapEvent) {
      this.listeners.click?.forEach((fn) => fn(event));
    }
  }

  let lastMap: FakeMap | null = null;
  let createdMarkers: FakeMarker[] = [];

  class TrackedFakeMap extends FakeMap {
    constructor() {
      super();
      lastMap = this;
    }
  }
  class TrackedFakeMarker extends FakeMarker {
    constructor() {
      super();
      createdMarkers.push(this);
    }
  }
  class FakeNavigationControl {}

  return {
    TrackedFakeMap,
    TrackedFakeMarker,
    FakeNavigationControl,
    getLastMap: () => lastMap,
    getCreatedMarkers: () => createdMarkers,
    resetCreatedMarkers: () => {
      createdMarkers = [];
    },
  };
});

vi.mock("maplibre-gl/dist/maplibre-gl-csp", () => ({
  default: {
    Map: TrackedFakeMap,
    Marker: TrackedFakeMarker,
    NavigationControl: FakeNavigationControl,
    setWorkerUrl: () => {},
  },
}));

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));

describe("TravelMap", () => {
  it("reports a picked location when the map is clicked in pickable mode", () => {
    const onPick = vi.fn();
    render(<TravelMap pickable onPick={onPick} pickedLocation={null} />);

    getLastMap()?.__fireClick({ lngLat: { lng: 12, lat: 34 } });

    expect(onPick).toHaveBeenCalledWith({ latitude: 34, longitude: 12 });
  });

  it("does not report clicks when not pickable", () => {
    const onPick = vi.fn();
    render(<TravelMap onPick={onPick} />);

    getLastMap()?.__fireClick({ lngLat: { lng: 12, lat: 34 } });

    expect(onPick).not.toHaveBeenCalled();
  });

  it("renders one marker per pin and reports the right pin id on click", () => {
    resetCreatedMarkers();
    const onMarkerClick = vi.fn();
    render(
      <TravelMap
        pins={[
          { id: "pin-1", latitude: 1, longitude: 2 },
          { id: "pin-2", latitude: 3, longitude: 4 },
        ]}
        onMarkerClick={onMarkerClick}
      />,
    );

    const markers = getCreatedMarkers();
    expect(markers).toHaveLength(2);

    fireEvent.click(markers[1].getElement());

    expect(onMarkerClick).toHaveBeenCalledWith("pin-2");
  });
});
