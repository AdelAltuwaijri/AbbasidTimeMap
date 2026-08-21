"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ErrorEvent as MapLibreErrorEvent,
  GeoJSONSource,
  Map,
  NavigationControl,
  type MapLayerMouseEvent,
} from "maplibre-gl";

import {
  BASEMAP_SOURCE_ID,
  EVENT_LAYER_ID,
  EVENT_SOURCE_ID,
  BOUNDARY_LAYER_ID,
  BOUNDARY_OUTLINE_LAYER_ID,
  BOUNDARY_SOURCE_ID,
  MAP_INITIAL_VIEW,
  SELECTED_EVENT_LAYER_ID,
  createMapStyle,
} from "../config/map-config";
import type { BoundaryFeatureCollection, EventFeatureCollection } from "../types";

interface HistoricalMapProps {
  boundaries: BoundaryFeatureCollection;
  boundariesVisible: boolean;
  events: EventFeatureCollection;
  eventsVisible: boolean;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
}

export function HistoricalMap({
  boundaries,
  boundariesVisible,
  events,
  eventsVisible,
  selectedEventId,
  onSelectEvent,
}: HistoricalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const eventsRef = useRef(events);
  const boundariesRef = useRef(boundaries);
  const boundariesVisibilityRef = useRef(boundariesVisible);
  const eventsVisibilityRef = useRef(eventsVisible);
  const selectedIdRef = useRef(selectedEventId);
  const selectHandlerRef = useRef(onSelectEvent);
  const [basemapLoadFailed, setBasemapLoadFailed] = useState(false);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);
  useEffect(() => {
    boundariesRef.current = boundaries;
  }, [boundaries]);

  useEffect(() => {
    boundariesVisibilityRef.current = boundariesVisible;
  }, [boundariesVisible]);

  useEffect(() => {
    eventsVisibilityRef.current = eventsVisible;
  }, [eventsVisible]);

  useEffect(() => {
    selectedIdRef.current = selectedEventId;
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    const selected = events.features.find((feature) => feature.properties.id === selectedEventId);
    if (selected) mapRef.current?.flyTo({ center: selected.geometry.coordinates, zoom: Math.max(mapRef.current.getZoom(), 6), essential: true });
  }, [events.features, selectedEventId]);

  useEffect(() => {
    selectHandlerRef.current = onSelectEvent;
  }, [onSelectEvent]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new Map({
      container: containerRef.current,
      ...MAP_INITIAL_VIEW,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-left");

    const handleMarkerClick = (event: MapLayerMouseEvent) => {
      const featureId = event.features?.[0]?.properties?.id;
      if (typeof featureId === "string") selectHandlerRef.current(featureId);
    };

    const handleMapError = (event: MapLibreErrorEvent & { sourceId?: string }) => {
      if (!event.sourceId || event.sourceId === BASEMAP_SOURCE_ID) {
        setBasemapLoadFailed(true);
      }
    };

    map.on("error", handleMapError);

    const ensureHistoricalLayers = () => {
      if (!map.getSource(EVENT_SOURCE_ID)) {
        map.addSource(EVENT_SOURCE_ID, { type: "geojson", data: eventsRef.current });
      }
      if (!map.getSource(BOUNDARY_SOURCE_ID)) {
        map.addSource(BOUNDARY_SOURCE_ID, { type: "geojson", data: boundariesRef.current });
      }
      const firstEventLayer = map.getLayer(EVENT_LAYER_ID)
        ? EVENT_LAYER_ID
        : map.getLayer(SELECTED_EVENT_LAYER_ID)
          ? SELECTED_EVENT_LAYER_ID
          : undefined;
      if (!map.getLayer(BOUNDARY_LAYER_ID)) {
        map.addLayer({
          id: BOUNDARY_LAYER_ID,
          source: BOUNDARY_SOURCE_ID,
          type: "fill",
          layout: { visibility: boundariesVisibilityRef.current ? "visible" : "none" },
          paint: { "fill-color": "#c99745", "fill-opacity": 0.12 },
        }, firstEventLayer);
      }
      if (!map.getLayer(BOUNDARY_OUTLINE_LAYER_ID)) {
        map.addLayer({
          id: BOUNDARY_OUTLINE_LAYER_ID,
          source: BOUNDARY_SOURCE_ID,
          type: "line",
          layout: { visibility: boundariesVisibilityRef.current ? "visible" : "none" },
          paint: { "line-color": "#c99745", "line-width": 1.5 },
        }, firstEventLayer);
      }
      if (!map.getLayer(EVENT_LAYER_ID)) {
        map.addLayer({
          id: EVENT_LAYER_ID,
          source: EVENT_SOURCE_ID,
          type: "circle",
          layout: { visibility: eventsVisibilityRef.current ? "visible" : "none" },
          paint: {
            "circle-color": "#c99745",
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 8, 9],
            "circle-stroke-color": "#17130e",
            "circle-stroke-width": 2,
          },
          filter: ["!=", ["get", "id"], selectedIdRef.current ?? ""],
        });
      }
      if (!map.getLayer(SELECTED_EVENT_LAYER_ID)) {
        map.addLayer({
          id: SELECTED_EVENT_LAYER_ID,
          source: EVENT_SOURCE_ID,
          type: "circle",
          layout: { visibility: eventsVisibilityRef.current ? "visible" : "none" },
          paint: {
            "circle-color": "#f8e3a7",
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 9, 8, 14],
            "circle-stroke-color": "#c99745",
            "circle-stroke-width": 4,
            "circle-blur": 0.12,
          },
          filter: ["==", ["get", "id"], selectedIdRef.current ?? ""],
        });
      }
    };

    map.on("load", ensureHistoricalLayers);
    map.on("style.load", ensureHistoricalLayers);
    map.on("click", EVENT_LAYER_ID, handleMarkerClick);
    map.on("click", SELECTED_EVENT_LAYER_ID, handleMarkerClick);
    map.on("mouseenter", EVENT_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", EVENT_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });
    map.setStyle(createMapStyle());

    return () => {
      map.off("error", handleMapError);
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource(EVENT_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(events);
  }, [events]);

  useEffect(() => {
    const source = mapRef.current?.getSource(BOUNDARY_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(boundaries);
  }, [boundaries]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const visibility = boundariesVisible ? "visible" : "none";
    if (map.getLayer(BOUNDARY_LAYER_ID)) {
      map.setLayoutProperty(BOUNDARY_LAYER_ID, "visibility", visibility);
    }
    if (map.getLayer(BOUNDARY_OUTLINE_LAYER_ID)) {
      map.setLayoutProperty(BOUNDARY_OUTLINE_LAYER_ID, "visibility", visibility);
    }
  }, [boundariesVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer(EVENT_LAYER_ID)) return;
    const visibility = eventsVisible ? "visible" : "none";
    map.setLayoutProperty(EVENT_LAYER_ID, "visibility", visibility);
    map.setLayoutProperty(SELECTED_EVENT_LAYER_ID, "visibility", visibility);
  }, [eventsVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer(EVENT_LAYER_ID)) return;
    map.setFilter(EVENT_LAYER_ID, ["!=", ["get", "id"], selectedEventId ?? ""]);
    map.setFilter(SELECTED_EVENT_LAYER_ID, ["==", ["get", "id"], selectedEventId ?? ""]);
  }, [selectedEventId]);

  return (
    <div
      className="absolute inset-0"
      data-testid="historical-map"
    >
      <div
        ref={containerRef}
        aria-label="الخريطة التاريخية التفاعلية"
        className="h-full w-full"
        dir="ltr"
      />
      {basemapLoadFailed && (
        <div
          className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-xl border border-amber-500/60 bg-[#17130e]/95 px-4 py-2 text-sm text-amber-100 shadow-xl"
          role="alert"
        >
          تعذر تحميل الخريطة الأساسية
        </div>
      )}
    </div>
  );
}
