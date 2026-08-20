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
});
