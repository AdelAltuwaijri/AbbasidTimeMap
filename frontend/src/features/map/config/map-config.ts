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

// OpenFreeMap's current dark vector style is a replaceable geographic reference
// basemap. It is not an assertion of historical Abbasid political boundaries.
export const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

export function createMapStyle(): string | StyleSpecification {
  return BASEMAP_STYLE_URL;
}
