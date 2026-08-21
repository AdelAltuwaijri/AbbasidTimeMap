import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchTimelineState } from "@/features/timeline/api/timeline-client";
import { fetchEventDetail } from "@/features/events/api/event-client";
import type { BoundaryFeatureCollection, EventFeatureCollection } from "../types";
import { MapWorkspace } from "./map-workspace";

vi.mock("@/features/timeline/api/timeline-client", () => ({ fetchTimelineState: vi.fn() }));
vi.mock("@/features/events/api/event-client", () => ({ fetchEventDetail: vi.fn() }));
vi.mock("./historical-map", () => ({
  HistoricalMap: ({
    boundaries,
    boundariesVisible,
    eventsVisible,
    onSelectEvent,
    selectedEventId,
  }: {
    boundaries: BoundaryFeatureCollection;
    boundariesVisible: boolean;
    eventsVisible: boolean;
    onSelectEvent: (id: string | null) => void;
    selectedEventId: string | null;
  }) => (
    <div data-testid="historical-map">
      <span data-testid="active-boundary-id">{boundaries.features[0]?.id ?? "no-boundary"}</span>
      <span data-testid="active-boundary-geometry">
        {JSON.stringify(boundaries.features[0]?.geometry.coordinates ?? [])}
      </span>
      <span>{boundariesVisible ? "boundaries-visible" : "boundaries-hidden"}</span>
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
        slug: "founding-of-baghdad",
        title_ar: "تأسيس بغداد",
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

const DETAIL = {
  id: "event-1", slug: "founding-of-baghdad", title_ar: "تأسيس بغداد", title_en: "Founding of Baghdad",
  date_display_ar: "145 هـ (762 م)", date_display_en: "145 AH / 762 CE", year_start_hijri: 145,
  year_end_hijri: null, gregorian_reference: "762 CE", event_type: { code: "political", name_ar: "سياسي", name_en: "Political" },
  summary_ar: "ملخص تاريخي موثق", importance: 3, confidence: "high", primary_place: { slug: "baghdad", name_ar: "بغداد", name_en: "Baghdad" },
  related_people: [], related_states: [], sources: [{ title: "مصدر موثوق", author: "مؤلف", edition: null, publication_data: "بيانات نشر", url: "https://example.test/source", citation_locator: "فقرة البداية", support_type: "direct", reliability_note: null }],
};

const BOUNDARY_A: BoundaryFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "boundary-a",
      geometry: {
        type: "MultiPolygon",
        coordinates: [[[[40, 30], [45, 30], [45, 35], [40, 30]]]],
      },
      properties: {
        boundary_slug: "abbasid-extent-132-143",
        state_id: "state-1",
        state_slug: "abbasid-caliphate",
        state_name_ar: "الخلافة العباسية",
        valid_from_hijri: 132,
        valid_to_hijri: 143,
        confidence: "medium",
        spatial_precision: "approximate",
        source_count: 2,
        primary_source_title: "مرجع أكاديمي للحدود",
        primary_source_url: "https://example.test/boundary-source",
        reconstruction_note_ar: "يمثل نطاق السيطرة المباشرة بصورة تقريبية، وليس خط حدود دقيقًا.",
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
        type: "MultiPolygon",
        coordinates: [[[[40, 30], [52, 30], [52, 38], [40, 30]]]],
      },
      properties: {
        ...BOUNDARY_A.features[0].properties,
        boundary_slug: "abbasid-extent-144-154",
        valid_from_hijri: 144,
        valid_to_hijri: 154,
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
    vi.mocked(fetchEventDetail).mockResolvedValue(DETAIL);
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
    expect(screen.getByText("boundaries-visible")).toBeInTheDocument();
  });

  it("replaces A with B when the selected year changes", async () => {
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce({
        year_hijri: 132,
        metadata: { calendar: "hijri", granularity: "year" },
        events: [],
        event_features: COLLECTION,
        boundaries: BOUNDARY_A,
      })
      .mockResolvedValueOnce({
        year_hijri: 133,
        metadata: { calendar: "hijri", granularity: "year" },
        events: [],
        event_features: COLLECTION,
        boundaries: BOUNDARY_B,
      });
    render(<MapWorkspace />);

    await waitFor(() => expect(screen.getByTestId("active-boundary-id")).toHaveTextContent("boundary-a"));
    expect(screen.getByTestId("active-boundary-geometry")).toHaveTextContent("45");
    fireEvent.click(screen.getByRole("button", { name: "السنة التالية" }));

    await waitFor(() => expect(screen.getByTestId("active-boundary-id")).toHaveTextContent("boundary-b"));
    expect(screen.getByTestId("active-boundary-geometry")).toHaveTextContent("52");
    expect(fetchTimelineState).toHaveBeenLastCalledWith(133, expect.anything());
  });

  it("keeps the independent boundary toggle hidden across year changes", async () => {
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce({
        year_hijri: 132,
        metadata: { calendar: "hijri", granularity: "year" },
        events: [],
        event_features: COLLECTION,
        boundaries: BOUNDARY_A,
      })
      .mockResolvedValueOnce({
        year_hijri: 133,
        metadata: { calendar: "hijri", granularity: "year" },
        events: [],
        event_features: COLLECTION,
        boundaries: BOUNDARY_B,
      });
    render(<MapWorkspace />);

    await waitFor(() => expect(screen.getByTestId("active-boundary-id")).toHaveTextContent("boundary-a"));
    fireEvent.click(screen.getByRole("checkbox", { name: "إظهار الحدود السياسية التاريخية" }));
    expect(screen.getByText("boundaries-hidden")).toBeInTheDocument();
    expect(screen.getByText("events-visible")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "السنة التالية" }));
    await waitFor(() => expect(screen.getByTestId("active-boundary-id")).toHaveTextContent("boundary-b"));
    expect(screen.getByText("boundaries-hidden")).toBeInTheDocument();
  });

  it("clears a stale boundary when the new timeline request fails", async () => {
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce({
        year_hijri: 132,
        metadata: { calendar: "hijri", granularity: "year" },
        events: [],
        event_features: COLLECTION,
        boundaries: BOUNDARY_A,
      })
      .mockRejectedValueOnce(new Error("offline"));
    render(<MapWorkspace />);

    await waitFor(() => expect(screen.getByTestId("active-boundary-id")).toHaveTextContent("boundary-a"));
    fireEvent.click(screen.getByRole("button", { name: "السنة التالية" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("تعذّر تحميل بيانات الخريطة التاريخية");
    expect(screen.getByTestId("active-boundary-id")).toHaveTextContent("no-boundary");
    expect(screen.queryByLabelText("بيانات إعادة بناء الحدود السياسية")).not.toBeInTheDocument();
  });

  it("shows concise RTL provenance and uncertainty disclosure", async () => {
    vi.mocked(fetchTimelineState).mockResolvedValueOnce({
      year_hijri: 132,
      metadata: { calendar: "hijri", granularity: "year" },
      events: [],
      event_features: COLLECTION,
      boundaries: BOUNDARY_A,
    });
    render(<MapWorkspace />);

    const disclosure = await screen.findByLabelText("بيانات إعادة بناء الحدود السياسية");
    expect(disclosure).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { name: "الخلافة العباسية" })).toBeInTheDocument();
    expect(screen.getByText("نطاق مكاني تقريبي", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(BOUNDARY_A.features[0].properties.reconstruction_note_ar)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "مرجع أكاديمي للحدود" })).toHaveAttribute(
      "href",
      "https://example.test/boundary-source",
    );
  });

  it("opens an RTL drawer with sourced detail and closes it without changing selection year", async () => {
    render(<MapWorkspace />);
    await screen.findByText("events-visible");

    fireEvent.click(screen.getByRole("button", { name: "test marker" }));

    expect(screen.getByText("event-1")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "تأسيس بغداد" })).toBeInTheDocument();
    expect(fetchEventDetail).toHaveBeenCalledWith("founding-of-baghdad", expect.any(AbortSignal));
    expect(screen.getByText("المصادر التاريخية")).toBeInTheDocument();
    expect(screen.getByText("موثق بدرجة عالية")).toBeInTheDocument();
    const close = screen.getByRole("button", { name: "إغلاق تفاصيل الحدث" });
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(screen.queryByRole("heading", { name: "تأسيس بغداد" })).not.toBeInTheDocument();
  });

  it("shows a retryable Arabic drawer error without changing timeline selection", async () => {
    vi.mocked(fetchEventDetail).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(DETAIL);
    render(<MapWorkspace />);
    await screen.findByText("events-visible");
    fireEvent.click(screen.getByRole("button", { name: "test marker" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("تعذّر تحميل تفاصيل الحدث");
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(await screen.findByRole("heading", { name: "تأسيس بغداد" })).toBeInTheDocument();
    expect(fetchTimelineState).toHaveBeenCalledOnce();
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
