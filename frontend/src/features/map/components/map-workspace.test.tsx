import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchTimelineState } from "@/features/timeline/api/timeline-client";
import type { EventFeatureCollection } from "../types";
import { MapWorkspace } from "./map-workspace";

vi.mock("@/features/timeline/api/timeline-client", () => ({ fetchTimelineState: vi.fn() }));
vi.mock("./historical-map", () => ({
  HistoricalMap: ({
    eventsVisible,
    onSelectEvent,
    selectedEventId,
  }: {
    eventsVisible: boolean;
    onSelectEvent: (id: string) => void;
    selectedEventId: string | null;
  }) => (
    <div data-testid="historical-map">
      <span>{eventsVisible ? "events-visible" : "events-hidden"}</span>
      <span>{selectedEventId ?? "nothing-selected"}</span>
      <button onClick={() => onSelectEvent("event-1")} type="button">
        test marker
      </button>
    </div>
  ),
}));

const COLLECTION: EventFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "event-1",
      geometry: { type: "Point", coordinates: [44.36, 33.31] },
      properties: {
        id: "event-1",
        slug: "fixture-event",
        title_ar: "حدث اختباري",
        entity_type: "event",
        event_type: "political",
        year_start_hijri: 145,
        year_end_hijri: null,
        importance: 3,
        confidence: "high",
      },
    },
  ],
};

describe("MapWorkspace", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTimelineState).mockResolvedValue({
      year_hijri: 132,
      metadata: { calendar: "hijri", granularity: "year" },
      events: [],
      event_features: COLLECTION,
      boundaries: { type: "FeatureCollection", features: [] },
    });
  });

  it("loads the map shell and GeoJSON data", async () => {
    render(<MapWorkspace />);

    expect(screen.getByTestId("historical-map")).toBeInTheDocument();
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledOnce());
  });

  it("toggles event-layer rendering state", async () => {
    render(<MapWorkspace />);
    await screen.findByText("events-visible");

    fireEvent.click(screen.getByRole("checkbox", { name: "إظهار الأحداث" }));

    expect(screen.getByText("events-hidden")).toBeInTheDocument();
  });

  it("keeps the selected event id and exposes a selection highlight card", async () => {
    render(<MapWorkspace />);
    await screen.findByText("events-visible");

    fireEvent.click(screen.getByRole("button", { name: "test marker" }));

    expect(screen.getByText("event-1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "حدث اختباري" })).toBeInTheDocument();
  });

  it("keeps layer visibility and clears a selection after the new year excludes it", async () => {
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce({ year_hijri: 132, metadata: { calendar: "hijri", granularity: "year" }, events: [], event_features: COLLECTION, boundaries: { type: "FeatureCollection", features: [] } })
      .mockResolvedValueOnce({ year_hijri: 133, metadata: { calendar: "hijri", granularity: "year" }, events: [], event_features: { type: "FeatureCollection", features: [] }, boundaries: { type: "FeatureCollection", features: [] } });
    render(<MapWorkspace />);
    await screen.findByText("events-visible");
    fireEvent.click(screen.getByRole("button", { name: "test marker" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "إظهار الأحداث" }));
    fireEvent.click(screen.getByRole("button", { name: "السنة التالية" }));
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledTimes(2));
    expect(screen.getByText("events-hidden")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("nothing-selected")).toBeInTheDocument());
  });
});
