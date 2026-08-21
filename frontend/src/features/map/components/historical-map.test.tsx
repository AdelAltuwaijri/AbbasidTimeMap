import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BASEMAP_SOURCE_ID,
  BOUNDARY_LAYER_ID,
  BOUNDARY_OUTLINE_LAYER_ID,
  BOUNDARY_SOURCE_ID,
  EVENT_LAYER_ID,
  SELECTED_EVENT_LAYER_ID,
} from "../config/map-config";
import type { BoundaryFeatureCollection, EventFeatureCollection } from "../types";
import { HistoricalMap } from "./historical-map";

const mocks = vi.hoisted(() => {
  const boundarySource = { setData: vi.fn() };
  const map = {
    addControl: vi.fn(),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    flyTo: vi.fn(),
    getCanvas: vi.fn(() => ({ style: {} })),
    getLayer: vi.fn(),
    getSource: vi.fn(),
    getZoom: vi.fn(() => 3.25),
    off: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
    setFilter: vi.fn(),
    setLayoutProperty: vi.fn(),
    setStyle: vi.fn(),
  };
  const mapConstructor = vi.fn(function MockMap() {
    return map;
  });
  return { boundarySource, map, mapConstructor };
});

const { boundarySource: boundarySourceMock, map: mapMock, mapConstructor } = mocks;

vi.mock("maplibre-gl", () => ({
  Map: mocks.mapConstructor,
  NavigationControl: vi.fn(function MockNavigationControl() {}),
}));

const EMPTY_EVENTS: EventFeatureCollection = { type: "FeatureCollection", features: [] };
const EMPTY_BOUNDARIES: BoundaryFeatureCollection = { type: "FeatureCollection", features: [] };
const BOUNDARY_A: BoundaryFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "boundary-a",
      geometry: {
        type: "Polygon",
        coordinates: [[[40, 30], [45, 30], [45, 35], [40, 30]]],
      },
      properties: {
        boundary_slug: "boundary-a",
        state_id: "state-1",
        state_slug: "abbasid-caliphate",
        state_name_ar: "الخلافة العباسية",
        valid_from_hijri: 132,
        valid_to_hijri: 143,
        confidence: "medium",
        spatial_precision: "approximate",
        source_count: 1,
        primary_source_title: "مصدر أكاديمي",
        primary_source_url: null,
        reconstruction_note_ar: "نطاق تقريبي.",
      },
    },
  ],
};
const BOUNDARY_B: BoundaryFeatureCollection = {
  ...BOUNDARY_A,
  features: [
    {
      ...BOUNDARY_A.features[0],
      id: "boundary-b",
      geometry: {
        type: "Polygon",
        coordinates: [[[40, 30], [52, 30], [52, 38], [40, 30]]],
      },
      properties: { ...BOUNDARY_A.features[0].properties, boundary_slug: "boundary-b" },
    },
  ],
};

function renderHistoricalMap({
  boundaries = EMPTY_BOUNDARIES,
  boundariesVisible = true,
}: {
  boundaries?: BoundaryFeatureCollection;
  boundariesVisible?: boolean;
} = {}) {
  return render(
    <HistoricalMap
      boundaries={boundaries}
      boundariesVisible={boundariesVisible}
      events={EMPTY_EVENTS}
      eventsVisible
      onSelectEvent={vi.fn()}
      selectedEventId={null}
    />,
  );
}

function registeredHandler(eventName: string) {
  return mapMock.on.mock.calls.find(([event]) => event === eventName)?.[1];
}

describe("HistoricalMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapMock.getLayer.mockReset();
    mapMock.getLayer.mockReturnValue(undefined);
    mapMock.getSource.mockReset();
    mapMock.getSource.mockReturnValue(undefined);
    mapMock.getZoom.mockReturnValue(3.25);
  });

  afterEach(cleanup);

  it("registers error handling before loading the basemap and reports basemap failures", () => {
    renderHistoricalMap();

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

  it("adds translucent boundary layers below both event-marker layers", () => {
    renderHistoricalMap({ boundaries: BOUNDARY_A });

    act(() => {
      registeredHandler("load")?.();
    });

    const layerIds = mapMock.addLayer.mock.calls.map(([layer]) => layer.id);
    expect(layerIds).toEqual([
      BOUNDARY_LAYER_ID,
      BOUNDARY_OUTLINE_LAYER_ID,
      EVENT_LAYER_ID,
      SELECTED_EVENT_LAYER_ID,
    ]);
    expect(layerIds.indexOf(BOUNDARY_OUTLINE_LAYER_ID)).toBeLessThan(
      layerIds.indexOf(EVENT_LAYER_ID),
    );
    expect(mapMock.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: BOUNDARY_LAYER_ID,
        layout: { visibility: "visible" },
        paint: expect.objectContaining({ "fill-opacity": 0.12 }),
      }),
      undefined,
    );
  });

  it("updates boundary GeoJSON in place without recreating the map", () => {
    mapMock.getSource.mockImplementation((id) => (
      id === BOUNDARY_SOURCE_ID ? boundarySourceMock : undefined
    ));
    const { rerender } = renderHistoricalMap({ boundaries: BOUNDARY_A });
    boundarySourceMock.setData.mockClear();

    rerender(
      <HistoricalMap
        boundaries={BOUNDARY_B}
        boundariesVisible
        events={EMPTY_EVENTS}
        eventsVisible
        onSelectEvent={vi.fn()}
        selectedEventId={null}
      />,
    );

    expect(boundarySourceMock.setData).toHaveBeenCalledOnce();
    expect(boundarySourceMock.setData).toHaveBeenCalledWith(BOUNDARY_B);
    expect(mapConstructor).toHaveBeenCalledOnce();
  });

  it("applies independent visibility to both boundary layers only", () => {
    mapMock.getLayer.mockImplementation((id) => (
      [BOUNDARY_LAYER_ID, BOUNDARY_OUTLINE_LAYER_ID].includes(String(id)) ? { id } : undefined
    ));
    const { rerender } = renderHistoricalMap({ boundaries: BOUNDARY_A });
    mapMock.setLayoutProperty.mockClear();

    rerender(
      <HistoricalMap
        boundaries={BOUNDARY_A}
        boundariesVisible={false}
        events={EMPTY_EVENTS}
        eventsVisible
        onSelectEvent={vi.fn()}
        selectedEventId={null}
      />,
    );

    expect(mapMock.setLayoutProperty.mock.calls).toEqual([
      [BOUNDARY_LAYER_ID, "visibility", "none"],
      [BOUNDARY_OUTLINE_LAYER_ID, "visibility", "none"],
    ]);
    expect(mapMock.setLayoutProperty).not.toHaveBeenCalledWith(
      EVENT_LAYER_ID,
      "visibility",
      "none",
    );
  });
});
