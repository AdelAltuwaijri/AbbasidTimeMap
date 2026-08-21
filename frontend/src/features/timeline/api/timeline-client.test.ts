import { afterEach, describe, expect, it, vi } from "vitest";

import type { TimelineStateResponse } from "../types";
import { fetchTimelineState } from "./timeline-client";

const VALID_STATE = {
  year_hijri: 145,
  metadata: { calendar: "hijri", granularity: "year" },
  events: [],
  event_features: { type: "FeatureCollection", features: [] },
  boundaries: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "boundary-144-154",
        geometry: {
          type: "MultiPolygon",
          coordinates: [[[[40, 30], [50, 30], [50, 35], [40, 30]]]],
        },
        properties: {
          boundary_slug: "abbasid-extent-144-154",
          state_id: "state-1",
          state_slug: "abbasid-caliphate",
          state_name_ar: "الخلافة العباسية",
          valid_from_hijri: 144,
          valid_to_hijri: 154,
          confidence: "medium",
          spatial_precision: "approximate",
          source_count: 2,
          primary_source_title: "مصدر أكاديمي",
          primary_source_url: "https://example.test/source",
          reconstruction_note_ar: "إعادة بناء تقريبية للنطاق السياسي.",
        },
      },
    ],
  },
} satisfies TimelineStateResponse;

describe("fetchTimelineState", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts the typed Polygon/MultiPolygon boundary contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => VALID_STATE,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchTimelineState(145)).resolves.toEqual(VALID_STATE);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/timeline/state?year_hijri=145",
      { signal: undefined },
    );
  });

  it.each([
    ["missing collection", { ...VALID_STATE, boundaries: undefined }],
    [
      "unsupported geometry",
      {
        ...VALID_STATE,
        boundaries: {
          ...VALID_STATE.boundaries,
          features: [{ ...VALID_STATE.boundaries.features[0], geometry: { type: "Point", coordinates: [44, 33] } }],
        },
      },
    ],
    [
      "missing provenance",
      {
        ...VALID_STATE,
        boundaries: {
          ...VALID_STATE.boundaries,
          features: [{
            ...VALID_STATE.boundaries.features[0],
            properties: { ...VALID_STATE.boundaries.features[0].properties, source_count: 0 },
          }],
        },
      },
    ],
    [
      "inverted validity range",
      {
        ...VALID_STATE,
        boundaries: {
          ...VALID_STATE.boundaries,
          features: [{
            ...VALID_STATE.boundaries.features[0],
            properties: {
              ...VALID_STATE.boundaries.features[0].properties,
              valid_from_hijri: 155,
              valid_to_hijri: 144,
            },
          }],
        },
      },
    ],
  ])("rejects an invalid boundary response: %s", async (_label, payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    }));

    await expect(fetchTimelineState(145)).rejects.toThrow(
      "Timeline API returned an invalid state",
    );
  });
});
