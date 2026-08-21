import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchTimelineState } from "@/features/timeline/api/timeline-client";
import type { TimelineStateResponse } from "@/features/timeline/types";
import { fetchEventDetail } from "@/features/events/api/event-client";
import type { SearchResult } from "@/features/search/types";
import type {
  BoundaryFeatureCollection,
  EventFeatureCollection,
  MapFocusRequest,
} from "../types";
import { MapWorkspace } from "./map-workspace";

const searchHarness = vi.hoisted(() => ({
  focus: vi.fn(),
  result: null as unknown,
}));

vi.mock("@/features/timeline/api/timeline-client", () => ({ fetchTimelineState: vi.fn() }));
vi.mock("@/features/events/api/event-client", () => ({ fetchEventDetail: vi.fn() }));
vi.mock("@/features/search/components/search-command", async () => {
  const React = await import("react");
  return {
    SearchCommand: React.forwardRef<
      { focus: () => void },
      { onSelectResult: (result: unknown) => void }
    >(function SearchCommandMock({ onSelectResult }, ref) {
      React.useImperativeHandle(ref, () => ({ focus: searchHarness.focus }));
      return (
        <button
          aria-label="اختيار نتيجة البحث الاختبارية"
          onClick={() => onSelectResult(searchHarness.result)}
          type="button"
        >
          search result
        </button>
      );
    }),
  };
});
vi.mock("./historical-map", () => ({
  HistoricalMap: ({
    boundaries,
    boundariesVisible,
    eventsVisible,
    focusRequest,
    onSelectEvent,
    selectedEventId,
  }: {
    boundaries: BoundaryFeatureCollection;
    boundariesVisible: boolean;
    eventsVisible: boolean;
    focusRequest: MapFocusRequest | null;
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
      <span data-testid="selected-event-id">{selectedEventId ?? "nothing-selected"}</span>
      <span data-testid="map-focus-request">
        {focusRequest ? JSON.stringify(focusRequest) : "no-focus"}
      </span>
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

const EVENT_RESULT = {
  entity_type: "event",
  id: "event-1",
  slug: "founding-of-baghdad",
  title_ar: "تأسيس بغداد",
  title_en: "Founding of Baghdad",
  subtitle_ar: "حدث سياسي في 145هـ",
  relevant_hijri_year: 145,
  relevant_end_year: null,
  coordinates: { longitude: 44.36, latitude: 33.31 },
  bounds: null,
  confidence: "high",
  navigation_event_id: "event-1",
  navigation_event_slug: "founding-of-baghdad",
} satisfies SearchResult;

const PERSON_RESULT = {
  ...EVENT_RESULT,
  entity_type: "person",
  id: "person-1",
  slug: "al-mansur",
  title_ar: "أبو جعفر المنصور",
  title_en: "Al-Mansur",
  subtitle_ar: "مرتبط بحدث تأسيس بغداد",
  confidence: "medium",
} satisfies SearchResult;

const PLACE_RESULT = {
  ...EVENT_RESULT,
  entity_type: "place",
  id: "place-1",
  slug: "baghdad",
  title_ar: "بغداد",
  title_en: "Baghdad",
  subtitle_ar: "مكان مرتبط بحدث تأسيس بغداد",
  confidence: null,
} satisfies SearchResult;

const STATE_RESULT = {
  ...EVENT_RESULT,
  entity_type: "state",
  id: "state-1",
  slug: "abbasid-caliphate",
  title_ar: "الخلافة العباسية",
  title_en: "Abbasid Caliphate",
  subtitle_ar: "حدود سياسية تاريخية معاد بناؤها",
  relevant_hijri_year: 132,
  relevant_end_year: 143,
  coordinates: null,
  bounds: { west: 20, south: 10, east: 60, north: 40 },
  confidence: "medium",
  navigation_event_id: null,
  navigation_event_slug: null,
} satisfies SearchResult;

const UNMAPPED_EVENT_RESULT = {
  ...EVENT_RESULT,
  id: "event-unmapped",
  slug: "unmapped-event",
  title_ar: "حدث بلا موضع",
  title_en: null,
  subtitle_ar: "حدث منشور في 150هـ",
  relevant_hijri_year: 150,
  coordinates: null,
  navigation_event_id: "event-unmapped",
  navigation_event_slug: "unmapped-event",
} satisfies SearchResult;

const UNMAPPED_PLACE_RESULT = {
  ...PLACE_RESULT,
  id: "place-unmapped",
  slug: "unmapped-place",
  title_ar: "موضع بلا هندسة",
  title_en: null,
  subtitle_ar: "موضع تاريخي بلا إحداثيات مخزنة",
  relevant_hijri_year: 150,
  coordinates: null,
  navigation_event_id: "event-unmapped",
  navigation_event_slug: "unmapped-event",
} satisfies SearchResult;

function timelineResponse({
  boundaries = EMPTY_BOUNDARIES,
  eventFeatures = COLLECTION,
  eventSlug = "founding-of-baghdad",
  year,
}: {
  boundaries?: BoundaryFeatureCollection;
  eventFeatures?: EventFeatureCollection;
  eventSlug?: string | null;
  year: number;
}): TimelineStateResponse {
  return {
    year_hijri: year,
    metadata: { calendar: "hijri", granularity: "year" },
    events: eventSlug
      ? [{
        id: eventSlug === "founding-of-baghdad" ? "event-1" : "event-unmapped",
        slug: eventSlug,
        title_ar: eventSlug === "founding-of-baghdad" ? "تأسيس بغداد" : "حدث بلا موضع",
        event_type: "political",
        year_start_hijri: year,
        year_end_hijri: null,
        importance: 3,
        confidence: "high",
      }]
      : [],
    event_features: eventFeatures,
    boundaries,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

const EMPTY_BOUNDARIES: BoundaryFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

describe("MapWorkspace", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    searchHarness.result = EVENT_RESULT;
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

  it("restarts detail loading when the same marker is selected again", async () => {
    render(<MapWorkspace />);
    await screen.findByText("events-visible");

    fireEvent.click(screen.getByRole("button", { name: "test marker" }));
    await waitFor(() => expect(fetchEventDetail).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "test marker" }));

    await waitFor(() => expect(fetchEventDetail).toHaveBeenCalledTimes(2));
    expect(fetchEventDetail).toHaveBeenLastCalledWith(
      "founding-of-baghdad",
      expect.any(AbortSignal),
    );
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

  it("waits for the matching timeline year before focusing and opening a mapped Event", async () => {
    const targetYear = deferred<TimelineStateResponse>();
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce(timelineResponse({ year: 132, eventSlug: null }))
      .mockReturnValueOnce(targetYear.promise);
    render(<MapWorkspace />);
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "اختيار نتيجة البحث الاختبارية" }));

    expect(screen.getByText("145هـ")).toBeInTheDocument();
    expect(screen.getByTestId("map-focus-request")).toHaveTextContent("no-focus");
    expect(fetchEventDetail).not.toHaveBeenCalled();

    targetYear.resolve(timelineResponse({ year: 145 }));

    await waitFor(() => expect(screen.getByTestId("selected-event-id")).toHaveTextContent("event-1"));
    expect(screen.getByTestId("map-focus-request")).toHaveTextContent('"kind":"point"');
    expect(await screen.findByRole("heading", { name: "تأسيس بغداد" })).toBeInTheDocument();
    expect(fetchEventDetail).toHaveBeenCalledWith("founding-of-baghdad", expect.any(AbortSignal));
  });

  it("opens an unmapped Event drawer independently from marker availability", async () => {
    searchHarness.result = UNMAPPED_EVENT_RESULT;
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce(timelineResponse({ year: 132, eventSlug: null }))
      .mockResolvedValueOnce(timelineResponse({
        year: 150,
        eventFeatures: { type: "FeatureCollection", features: [] },
        eventSlug: "unmapped-event",
      }));
    render(<MapWorkspace />);
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "اختيار نتيجة البحث الاختبارية" }));

    await waitFor(() => expect(fetchEventDetail).toHaveBeenCalledWith(
      "unmapped-event",
      expect.any(AbortSignal),
    ));
    expect(screen.getByTestId("selected-event-id")).toHaveTextContent("nothing-selected");
    expect(screen.getByTestId("map-focus-request")).toHaveTextContent("no-focus");
    expect(await screen.findByLabelText("تفاصيل الحدث التاريخي")).toBeInTheDocument();
  });

  it("uses a Person result's declared Event context and restores search focus on close", async () => {
    searchHarness.result = PERSON_RESULT;
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce(timelineResponse({ year: 132, eventSlug: null }))
      .mockResolvedValueOnce(timelineResponse({ year: 145 }));
    render(<MapWorkspace />);
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("checkbox", { name: "إظهار الأحداث" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "إظهار الحدود السياسية التاريخية" }));

    fireEvent.click(screen.getByRole("button", { name: "اختيار نتيجة البحث الاختبارية" }));

    expect(await screen.findByRole("heading", { name: "تأسيس بغداد" })).toBeInTheDocument();
    expect(fetchEventDetail).toHaveBeenCalledWith("founding-of-baghdad", expect.any(AbortSignal));
    expect(screen.getByTestId("selected-event-id")).toHaveTextContent("event-1");
    expect(screen.getByText("events-hidden")).toBeInTheDocument();
    expect(screen.getByText("boundaries-hidden")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إغلاق تفاصيل الحدث" }));
    await waitFor(() => expect(searchHarness.focus).toHaveBeenCalledOnce());
  });

  it("focuses a Place point and exposes concise context without opening a drawer", async () => {
    searchHarness.result = PLACE_RESULT;
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce(timelineResponse({ year: 132, eventSlug: null }))
      .mockResolvedValueOnce(timelineResponse({ year: 145 }));
    render(<MapWorkspace />);
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "اختيار نتيجة البحث الاختبارية" }));

    const context = await screen.findByLabelText("سياق نتيجة البحث التاريخي");
    expect(context).toHaveAttribute("dir", "rtl");
    expect(context).toHaveTextContent("بغداد");
    expect(screen.getByTestId("map-focus-request")).toHaveTextContent('"kind":"point"');
    expect(screen.getByTestId("selected-event-id")).toHaveTextContent("nothing-selected");
    expect(fetchEventDetail).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("تفاصيل الحدث التاريخي")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "السنة التالية" }));
    expect(screen.queryByLabelText("سياق نتيجة البحث التاريخي")).not.toBeInTheDocument();
  });

  it("frames State Boundary bounds without opening an Event or State drawer", async () => {
    searchHarness.result = STATE_RESULT;
    vi.mocked(fetchTimelineState).mockResolvedValueOnce(timelineResponse({
      year: 132,
      boundaries: BOUNDARY_A,
      eventSlug: null,
    }));
    render(<MapWorkspace />);
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "اختيار نتيجة البحث الاختبارية" }));

    const context = await screen.findByLabelText("سياق نتيجة البحث التاريخي");
    expect(context).toHaveTextContent("الخلافة العباسية");
    expect(screen.getByTestId("map-focus-request")).toHaveTextContent('"kind":"bounds"');
    expect(screen.getByTestId("map-focus-request")).toHaveTextContent("[[20,10],[60,40]]");
    expect(fetchTimelineState).toHaveBeenCalledOnce();
    expect(fetchEventDetail).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("تفاصيل الحدث التاريخي")).not.toBeInTheDocument();
  });

  it("does not fabricate focus for a result without supported geometry", async () => {
    searchHarness.result = UNMAPPED_PLACE_RESULT;
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce(timelineResponse({ year: 132, eventSlug: null }))
      .mockResolvedValueOnce(timelineResponse({
        year: 150,
        eventFeatures: { type: "FeatureCollection", features: [] },
        eventSlug: "unmapped-event",
      }));
    render(<MapWorkspace />);
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "اختيار نتيجة البحث الاختبارية" }));

    expect(await screen.findByLabelText("سياق نتيجة البحث التاريخي")).toHaveTextContent("موضع بلا هندسة");
    expect(screen.getByTestId("map-focus-request")).toHaveTextContent("no-focus");
    expect(screen.getByRole("status", { name: "إعلان التنقل التاريخي" })).toHaveTextContent(
      "لا تتوفر له هندسة مكانية منشورة",
    );
  });

  it("ignores an older year response after a rapid second search selection", async () => {
    const firstYear = deferred<TimelineStateResponse>();
    const secondYear = deferred<TimelineStateResponse>();
    vi.mocked(fetchTimelineState)
      .mockResolvedValueOnce(timelineResponse({ year: 132, eventSlug: null }))
      .mockReturnValueOnce(firstYear.promise)
      .mockReturnValueOnce(secondYear.promise);
    render(<MapWorkspace />);
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledOnce());

    searchHarness.result = EVENT_RESULT;
    fireEvent.click(screen.getByRole("button", { name: "اختيار نتيجة البحث الاختبارية" }));
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledTimes(2));

    searchHarness.result = UNMAPPED_EVENT_RESULT;
    fireEvent.click(screen.getByRole("button", { name: "اختيار نتيجة البحث الاختبارية" }));
    await waitFor(() => expect(fetchTimelineState).toHaveBeenCalledTimes(3));

    firstYear.resolve(timelineResponse({ year: 145 }));
    await Promise.resolve();
    expect(fetchEventDetail).not.toHaveBeenCalled();

    secondYear.resolve(timelineResponse({
      year: 150,
      eventFeatures: { type: "FeatureCollection", features: [] },
      eventSlug: "unmapped-event",
    }));
    await waitFor(() => expect(fetchEventDetail).toHaveBeenCalledOnce());
    expect(fetchEventDetail).toHaveBeenCalledWith("unmapped-event", expect.any(AbortSignal));
    expect(screen.getByText("150هـ")).toBeInTheDocument();
    expect(screen.getByTestId("selected-event-id")).toHaveTextContent("nothing-selected");
  });
});
