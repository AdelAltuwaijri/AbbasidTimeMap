import { afterEach, describe, expect, it, vi } from "vitest";

import type { EventDetail } from "../types";
import { fetchEventDetail } from "./event-client";

const EVENT_ID = "00000000-0000-0000-0000-000000000001";
const PERSON_ID = "00000000-0000-0000-0000-000000000002";
const PLACE_ID = "00000000-0000-0000-0000-000000000003";
const STATE_ID = "00000000-0000-0000-0000-000000000004";
const SOURCE_ID = "00000000-0000-0000-0000-000000000005";

const VALID_DETAIL = {
  id: EVENT_ID,
  slug: "al-muqanna-revolt",
  title_ar: "بداية حركة المقنع وأصحاب البياض",
  title_en: "Revolt of al-Muqannaʿ and the White-Clad",
  start_date: {
    calendar: "hijri",
    year: 159,
    month: null,
    day: null,
    precision: "approximate",
    circa: true,
    display_label_ar: "نحو 159هـ",
    display_label_en: "c. 775–776 CE",
  },
  end_date: {
    calendar: "hijri",
    year: 163,
    month: null,
    day: null,
    precision: "disputed",
    circa: true,
    display_label_ar: "إلى 163هـ أو بعده بقليل",
    display_label_en: "to 780 CE or later",
  },
  date_display_ar: "نحو 159هـ",
  date_display_en: "c. 775–776 CE",
  year_start_hijri: 159,
  year_end_hijri: 163,
  gregorian_reference: "c. 775–776 CE",
  event_type: { code: "revolt", name_ar: "ثورة", name_en: "Revolt" },
  summary_ar: "ملخص موثق.",
  summary_en: null,
  causes_ar: "سبب موثق.",
  consequences_ar: "نتيجة موثقة.",
  importance: 4,
  confidence: "disputed",
  primary_place: {
    id: PLACE_ID,
    slug: "transoxiana",
    name_ar: "ما وراء النهر",
    name_en: "Transoxiana",
  },
  related_people: [{
    id: PERSON_ID,
    slug: "al-muqanna",
    name_ar: "المقنع الخراساني",
    name_en: "al-Muqannaʿ",
    role_code: "movement_leader",
  }],
  related_places: [{
    id: PLACE_ID,
    slug: "transoxiana-region",
    name_ar: "إقليم ما وراء النهر",
    name_en: "Transoxiana region",
    relation_type: "movement_region",
  }],
  related_states: [{
    id: STATE_ID,
    slug: "khurramiyya-movements",
    name_ar: "الحركات الخرمية وأصحاب البياض",
    name_en: "Khurramiyya and White-Clad movements",
    relation_type: "rebel_movement",
  }],
  sources: [{
    id: SOURCE_ID,
    source_type: "modern_academic",
    title: "A scholarly source",
    author: "Historian",
    edition: "Second edition",
    publication_data: "Academic Press, 2020",
    url: "https://example.test/source",
    citation_locator: "pp. 10–12",
    support_type: "direct",
    reliability_note: "Peer-reviewed synthesis.",
  }],
} satisfies EventDetail;

describe("fetchEventDetail", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("accepts the complete structured public event contract and forwards AbortSignal", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => VALID_DETAIL,
    });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await expect(fetchEventDetail("al-muqanna-revolt", controller.signal)).resolves.toEqual(
      VALID_DETAIL,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/events/al-muqanna-revolt",
      { signal: controller.signal },
    );
  });

  it("accepts an empty optional person role code without exposing a contract gap", async () => {
    const payload = {
      ...VALID_DETAIL,
      related_people: [{ ...VALID_DETAIL.related_people[0], role_code: "" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));

    await expect(fetchEventDetail("al-muqanna-revolt")).resolves.toEqual(payload);
  });

  it.each([
    ["missing structured start date", { ...VALID_DETAIL, start_date: undefined }],
    [
      "unsupported precision",
      { ...VALID_DETAIL, start_date: { ...VALID_DETAIL.start_date, precision: "certain" } },
    ],
    [
      "invalid exact date components",
      {
        ...VALID_DETAIL,
        start_date: {
          ...VALID_DETAIL.start_date,
          precision: "exact",
          month: null,
          day: null,
        },
      },
    ],
    ["missing related people", { ...VALID_DETAIL, related_people: undefined }],
    [
      "missing relationship metadata",
      { ...VALID_DETAIL, related_states: [{ ...VALID_DETAIL.related_states[0], relation_type: undefined }] },
    ],
    ["empty source list", { ...VALID_DETAIL, sources: [] }],
    [
      "unsafe source URL",
      { ...VALID_DETAIL, sources: [{ ...VALID_DETAIL.sources[0], url: "javascript:alert(1)" }] },
    ],
    [
      "source URL containing credentials",
      {
        ...VALID_DETAIL,
        sources: [{
          ...VALID_DETAIL.sources[0],
          url: "https://user:secret@example.com/source",
        }],
      },
    ],
    [
      "source URL containing control characters",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "https://example.test/\nsource" }],
      },
    ],
    [
      "source URL containing a bidi control",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "https://example.test/\u202esource" }],
      },
    ],
    [
      "source URL with an invalid port",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "https://example.test:99999/source" }],
      },
    ],
    [
      "source URL with an invalid host",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "https://[::1/source" }],
      },
    ],
    [
      "source URL with an invalid DNS label",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "https://-example.test/source" }],
      },
    ],
    [
      "source URL with port zero",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "https://example.test:0/source" }],
      },
    ],
    [
      "HTTP URL without a hierarchical authority",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "http:example.test/source" }],
      },
    ],
    [
      "HTTPS URL without a hierarchical authority",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "https:example.test/source" }],
      },
    ],
    [
      "source URL with an empty port",
      {
        ...VALID_DETAIL,
        sources: [{ ...VALID_DETAIL.sources[0], url: "https://example.test:/source" }],
      },
    ],
    ["unclassified confidence", { ...VALID_DETAIL, confidence: null }],
    ["unsupported confidence", { ...VALID_DETAIL, confidence: "certain" }],
    ["invalid importance", { ...VALID_DETAIL, importance: 6 }],
  ])("rejects malformed public detail: %s", async (_label, payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));

    await expect(fetchEventDetail("al-muqanna-revolt")).rejects.toThrow(
      "Event detail API returned an invalid response",
    );
  });

  it("reports a non-success response without attempting to use its body", async () => {
    const json = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json }));

    await expect(fetchEventDetail("not-public")).rejects.toThrow("status 404");
    expect(json).not.toHaveBeenCalled();
  });
});
