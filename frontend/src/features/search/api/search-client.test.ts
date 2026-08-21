import { afterEach, describe, expect, it, vi } from "vitest";

import { searchHistoricalEntities } from "./search-client";

const BASE_RESULT = {
  entity_type: "place",
  id: "00000000-0000-0000-0000-000000000001",
  slug: "baghdad",
  title_ar: "بغداد",
  title_en: "Baghdad",
  subtitle_ar: "مكان — تأسيس بغداد، 145هـ",
  relevant_hijri_year: 145,
  relevant_end_year: null,
  coordinates: { longitude: 44.3661, latitude: 33.3152 },
  bounds: null,
  confidence: null,
  navigation_event_id: "00000000-0000-0000-0000-000000000002",
  navigation_event_slug: "founding-of-baghdad",
};

describe("searchHistoricalEntities", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("encodes a trimmed Arabic query, bounded limit, and AbortSignal", async () => {
    const payload = { query: "بغداد", results: [BASE_RESULT] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await expect(searchHistoricalEntities("  بغداد  ", controller.signal, 7)).resolves.toEqual(payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(decodeURIComponent(String(url))).toContain("q=بغداد");
    expect(String(url)).toContain("limit=7");
    expect(init).toEqual({ signal: controller.signal });
  });

  it("accepts 100 normalized visible characters even when Arabic marks increase raw length", async () => {
    const query = "بَ".repeat(100);
    const payload = { query, results: [] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchHistoricalEntities(`  ${query}  `)).resolves.toEqual(payload);
    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain(`q=${query}`);

    await expect(searchHistoricalEntities("بَ".repeat(101))).rejects.toThrow("2 and 100");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts every entity type and point or historical bounds focus", async () => {
    const results = [
      { ...BASE_RESULT, entity_type: "event" },
      { ...BASE_RESULT, entity_type: "person" },
      { ...BASE_RESULT, entity_type: "place" },
      {
        ...BASE_RESULT,
        entity_type: "state",
        coordinates: null,
        bounds: { west: 20, south: 10, east: 60, north: 40 },
        navigation_event_id: null,
        navigation_event_slug: null,
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ query: "العباسية", results }),
    }));

    await expect(searchHistoricalEntities("العباسية")).resolves.toMatchObject({ results });
  });

  it.each([
    ["unknown type", { ...BASE_RESULT, entity_type: "book" }],
    ["invalid point", { ...BASE_RESULT, coordinates: { longitude: 181, latitude: 33 } }],
    ["inverted bounds", { ...BASE_RESULT, coordinates: null, bounds: { west: 60, south: 10, east: 20, north: 40 } }],
    ["point and bounds", { ...BASE_RESULT, bounds: { west: 20, south: 10, east: 60, north: 40 } }],
    ["unpaired navigation event", { ...BASE_RESULT, navigation_event_id: null }],
    ["blank navigation event", { ...BASE_RESULT, navigation_event_slug: " " }],
  ])("rejects an invalid compact result: %s", async (_label, result) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ query: "بغداد", results: [result] }),
    }));

    await expect(searchHistoricalEntities("بغداد")).rejects.toThrow(
      "Search API returned an invalid response",
    );
  });

  it("rejects an invalid echoed response query", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ query: " ", results: [BASE_RESULT] }),
    }));

    await expect(searchHistoricalEntities("بغداد")).rejects.toThrow(
      "Search API returned an invalid response",
    );
  });

  it("rejects invalid local query and limit input without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchHistoricalEntities("ا")).rejects.toThrow("2 and 100");
    await expect(searchHistoricalEntities("بحث", undefined, 21)).rejects.toThrow("1 and 20");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
