import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchEventDetail } from "@/features/events/api/event-client";
import type { EventDetail } from "@/features/events/types";
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

const EVENT_RESULT = {
  ...BAGHDAD_RESULT,
  entity_type: "event",
  id: "event-1",
  slug: "founding-of-baghdad",
  title_ar: "تأسيس بغداد",
  title_en: "Founding of Baghdad",
  subtitle_ar: "حدث سياسي في 145هـ",
  confidence: "high",
} satisfies SearchResult;

const PERSON_RESULT = {
  ...BAGHDAD_RESULT,
  entity_type: "person",
  id: "person-1",
  slug: "al-mansur",
  title_ar: "أبو جعفر المنصور",
  title_en: "Al-Mansur",
  subtitle_ar: "شخصية مرتبطة بحدث تأسيس بغداد",
  confidence: "medium",
} satisfies SearchResult;

const EVENT_DETAIL = {
  id: "event-1",
  slug: "founding-of-baghdad",
  title_ar: "تأسيس بغداد",
  title_en: "Founding of Baghdad",
  start_date: {
    calendar: "hijri",
    year: 145,
    month: null,
    day: null,
    precision: "year",
    circa: false,
    display_label_ar: "145هـ",
    display_label_en: "762 CE",
  },
  end_date: null,
  date_display_ar: "145هـ",
  date_display_en: "762 CE",
  year_start_hijri: 145,
  year_end_hijri: null,
  gregorian_reference: "762 CE",
  event_type: { code: "political", name_ar: "سياسي", name_en: "Political" },
  summary_ar: "ملخص تاريخي موثق.",
  summary_en: null,
  causes_ar: "سبب تاريخي موثق.",
  consequences_ar: "نتيجة تاريخية موثقة.",
  importance: 3,
  confidence: "high",
  primary_place: {
    id: "place-1",
    slug: "baghdad",
    name_ar: "بغداد",
    name_en: "Baghdad",
  },
  related_people: [],
  related_places: [],
  related_states: [],
  sources: [{
    id: "source-1",
    source_type: "scholarly_encyclopedia",
    title: "مصدر تاريخي موثوق",
    author: "مؤلف",
    edition: null,
    publication_data: "بيانات نشر",
    url: "https://example.test/source",
    citation_locator: "موضع الاستشهاد",
    support_type: "direct",
    reliability_note: null,
  }],
} satisfies EventDetail;

function timelineWithBaghdad(year: number) {
  const isEventYear = year === 145;
  return {
    year_hijri: year,
    metadata: { calendar: "hijri" as const, granularity: "year" as const },
    events: isEventYear
      ? [{
        id: "event-1",
        slug: "founding-of-baghdad",
        title_ar: "تأسيس بغداد",
        event_type: "political",
        year_start_hijri: 145,
        year_end_hijri: null,
        importance: 3,
        confidence: "high",
      }]
      : [],
    event_features: {
      type: "FeatureCollection" as const,
      features: isEventYear
        ? [{
          type: "Feature" as const,
          id: "event-1",
          geometry: { type: "Point" as const, coordinates: [44.36, 33.31] as [number, number] },
          properties: {
            id: "event-1",
            slug: "founding-of-baghdad",
            title_ar: "تأسيس بغداد",
            entity_type: "event" as const,
            event_type: "political",
            year_start_hijri: 145,
            year_end_hijri: null,
            importance: 3,
            confidence: "high",
          },
        }]
        : [],
    },
    boundaries: { type: "FeatureCollection" as const, features: [] },
  };
}

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

  it.each([
    ["Event", EVENT_RESULT],
    ["Person", PERSON_RESULT],
  ] as const)("opens the same complete Event Experience from an %s search result", async (
    _entityType,
    result,
  ) => {
    vi.mocked(searchHistoricalEntities).mockResolvedValue({
      query: result.title_ar,
      results: [result],
    });
    vi.mocked(fetchTimelineState).mockImplementation(async (year) => timelineWithBaghdad(year));
    vi.mocked(fetchEventDetail).mockResolvedValue(EVENT_DETAIL);
    render(<MapWorkspace />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });

    fireEvent.change(input, { target: { value: result.title_ar } });
    fireEvent.click(await screen.findByRole("option", { name: new RegExp(result.title_ar) }));

    expect(await screen.findByRole("heading", { name: EVENT_DETAIL.title_ar })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ماذا حدث؟" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "لماذا حدث؟" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ماذا نتج عنه؟" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "المصادر التاريخية" })).toBeInTheDocument();
    expect(screen.getByText("موثق بدرجة عالية")).toBeInTheDocument();
    expect(fetchEventDetail).toHaveBeenCalledWith(
      "founding-of-baghdad",
      expect.any(AbortSignal),
    );
  });
});
