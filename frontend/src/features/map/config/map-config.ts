import type { StyleSpecification } from "maplibre-gl";

export const MAP_INITIAL_VIEW = {
  center: [43, 32] as [number, number],
  zoom: 3.25,
  minZoom: 2,
  maxZoom: 12,
};

export const EVENT_SOURCE_ID = "historical-events";
export const EVENT_LAYER_ID = "historical-event-markers";
export const SELECTED_EVENT_LAYER_ID = "selected-historical-event";
export const BOUNDARY_SOURCE_ID = "historical-boundaries";
export const BOUNDARY_LAYER_ID = "historical-boundaries-fill";
export const BOUNDARY_OUTLINE_LAYER_ID = "historical-boundaries-outline";
export const BASEMAP_SOURCE_ID = "reference-basemap";
export const BASEMAP_LAYER_ID = "reference-basemap-raster";

export const BASEMAP_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function createMapStyle(): string | StyleSpecification {
  return {
    version: 8,
    name: "Abbasid TimeMap geographic reference basemap",
    sources: {
      [BASEMAP_SOURCE_ID]: {
        type: "raster",
        tiles: [BASEMAP_TILE_URL],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      },
    },
    layers: [
      {
        id: "reference-basemap-background",
        type: "background",
        paint: { "background-color": "#121713" },
      },
      {
        id: BASEMAP_LAYER_ID,
        type: "raster",
        source: BASEMAP_SOURCE_ID,
      },
    ],
  };
}
