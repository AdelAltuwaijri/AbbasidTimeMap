import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchEventFeatures } from "../api/map-client";
import type { EventFeatureCollection } from "../types";
import { MapWorkspace } from "./map-workspace";

vi.mock("../api/map-client", () => ({ fetchEventFeatures: vi.fn() }));
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
    vi.mocked(fetchEventFeatures).mockResolvedValue(COLLECTION);
  });

  it("loads the map shell and GeoJSON data", async () => {
    render(<MapWorkspace />);

    expect(screen.getByTestId("historical-map")).toBeInTheDocument();
    await waitFor(() => expect(fetchEventFeatures).toHaveBeenCalledOnce());
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
});
