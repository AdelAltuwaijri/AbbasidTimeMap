import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BASEMAP_SOURCE_ID } from "../config/map-config";
import { HistoricalMap } from "./historical-map";

const mapMock = vi.hoisted(() => ({
  addControl: vi.fn(),
  addLayer: vi.fn(),
  addSource: vi.fn(),
  getCanvas: vi.fn(() => ({ style: {} })),
  getLayer: vi.fn(),
  getSource: vi.fn(),
  off: vi.fn(),
  on: vi.fn(),
  remove: vi.fn(),
  setStyle: vi.fn(),
}));

vi.mock("maplibre-gl", () => ({
  Map: vi.fn(function MockMap() {
    return mapMock;
  }),
  NavigationControl: vi.fn(function MockNavigationControl() {}),
}));

describe("HistoricalMap", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("registers error handling before loading the basemap and reports basemap failures", () => {
    render(
      <HistoricalMap
        boundaries={{ type: "FeatureCollection", features: [] }}
        events={{ type: "FeatureCollection", features: [] }}
        eventsVisible
        onSelectEvent={vi.fn()}
        selectedEventId={null}
      />,
    );

    const errorCall = mapMock.on.mock.calls.find(([event]) => event === "error");
    expect(errorCall).toBeDefined();
    expect(mapMock.on.mock.invocationCallOrder[0]).toBeLessThan(
      mapMock.setStyle.mock.invocationCallOrder[0],
    );

    act(() => {
      errorCall?.[1]({ sourceId: BASEMAP_SOURCE_ID, error: new Error("offline") });
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "تعذر تحميل الخريطة الأساسية",
    );
  });
});
