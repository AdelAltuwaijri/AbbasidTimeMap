import { describe, expect, it } from "vitest";

import {
  BASEMAP_LAYER_ID,
  BASEMAP_SOURCE_ID,
  BASEMAP_TILE_URL,
  EVENT_SOURCE_ID,
  createMapStyle,
} from "./map-config";

describe("map configuration", () => {
  it("uses an inline geographic basemap while keeping historical data separate", () => {
    const style = createMapStyle();

    expect(style).not.toBeTypeOf("string");
    if (typeof style === "string") return;

    expect(style.sources[BASEMAP_SOURCE_ID]).toMatchObject({
      type: "raster",
      tiles: [BASEMAP_TILE_URL],
      maxzoom: 8,
    });
    expect(style.sources).not.toHaveProperty(EVENT_SOURCE_ID);
    expect(style.layers).toContainEqual(
      expect.objectContaining({
        id: BASEMAP_LAYER_ID,
        source: BASEMAP_SOURCE_ID,
        type: "raster",
      }),
    );
  });

  it("contains no provider-controlled labels or modern political layers", () => {
    const style = createMapStyle();

    expect(style).not.toBeTypeOf("string");
    if (typeof style === "string") return;

    expect(BASEMAP_TILE_URL).toContain("gibs.earthdata.nasa.gov");
    expect(BASEMAP_TILE_URL).toContain("BlueMarble_NextGeneration");
    expect(BASEMAP_TILE_URL).not.toContain("openstreetmap");
    expect(style.layers.every((layer) => layer.type !== "symbol")).toBe(true);

    const modernLayerPattern =
      /(admin|boundary|border|country|state|province|place|city|label|road|poi)/i;
    expect(style.layers.map((layer) => layer.id)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(modernLayerPattern)]),
    );
  });
});
