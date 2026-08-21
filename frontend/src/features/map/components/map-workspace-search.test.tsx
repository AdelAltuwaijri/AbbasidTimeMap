import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchEventDetail } from "@/features/events/api/event-client";
import { searchHistoricalEntities } from "@/features/search/api/search-client";
import type { SearchResult } from "@/features/search/types";
import { fetchTimelineState } from "@/features/timeline/api/timeline-client";
import type { MapFocusRequest } from "../types";
import { MapWorkspace } from "./map-workspace";

vi.mock("@/features/events/api/event-client", () => ({ fetchEventDetail: vi.fn() }));
vi.mock("@/features/search/api/search-client", () => ({ searchHistoricalEntities: vi.fn() }));
vi.mock("@/features/timeline/api/timeline-client", () => ({ fetchTimelineState: vi.fn() }));
vi.mock("./historical-map", () => ({
  HistoricalMap: ({
    eventsVisible,
    focusRequest,
  }: {
    eventsVisible: boolean;
    focusRequest: MapFocusRequest | null;
  }) => (
    <div data-testid="historical-map">
      <span>{eventsVisible ? "events-visible" : "events-hidden"}</span>
      <span data-testid="map-focus-request">
        {focusRequest ? JSON.stringify(focusRequest) : "no-focus"}
      </span>
    </div>
  ),
}));

const BAGHDAD_RESULT = {
  entity_type: "place",
  id: "place-1",
  slug: "baghdad",
  title_ar: "بغداد",
  title_en: "Baghdad",
  subtitle_ar: "مكان — تأسيس بغداد، 145هـ",
  relevant_hijri_year: 145,
  relevant_end_year: null,
  coordinates: { longitude: 44.36, latitude: 33.31 },
  bounds: null,
  confidence: null,
  navigation_event_id: "event-1",
  navigation_event_slug: "founding-of-baghdad",
} satisfies SearchResult;

describe("MapWorkspace search isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTimelineState).mockImplementation(async (year) => ({
      year_hijri: year,
      metadata: { calendar: "hijri", granularity: "year" },
      events: [],
      event_features: { type: "FeatureCollection", features: [] },
      boundaries: { type: "FeatureCollection", features: [] },
    }));
  });

  afterEach(cleanup);

  it("isolates search failure while map, layers, and timeline remain interactive", async () => {
    vi.mocked(searchHistoricalEntities).mockRejectedValue(new Error("offline"));
    render(<MapWorkspace />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });

    fireEvent.change(input, { target: { value: "بغداد" } });

    expect(await screen.findByRole("alert")).toHaveTextContent("تعذّر إجراء البحث");
    expect(screen.getByTestId("historical-map")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "إظهار الأحداث" }));
    expect(screen.getByText("events-hidden")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "السنة التالية" }));
    await waitFor(() => expect(fetchTimelineState).toHaveBeenLastCalledWith(133, expect.anything()));
  });

  it("dismisses results without changing timeline, selection, focus, or layers", async () => {
    vi.mocked(searchHistoricalEntities).mockResolvedValue({
      query: "بغداد",
      results: [BAGHDAD_RESULT],
    });
    render(<MapWorkspace />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });
    fireEvent.change(input, { target: { value: "بغداد" } });
    await screen.findByRole("option", { name: /بغداد/ });

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("132هـ")).toBeInTheDocument();
    expect(screen.getByText("events-visible")).toBeInTheDocument();
    expect(screen.getByTestId("map-focus-request")).toHaveTextContent("no-focus");
    expect(fetchEventDetail).not.toHaveBeenCalled();
  });
});
