"use client";

import { useEffect, useRef } from "react";
import {
  GeoJSONSource,
  Map,
  NavigationControl,
  type MapLayerMouseEvent,
} from "maplibre-gl";

import {
  EVENT_LAYER_ID,
  EVENT_SOURCE_ID,
  MAP_INITIAL_VIEW,
  SELECTED_EVENT_LAYER_ID,
  createMapStyle,
} from "../config/map-config";
import type { EventFeatureCollection } from "../types";

interface HistoricalMapProps {
  events: EventFeatureCollection;
  eventsVisible: boolean;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
}

export function HistoricalMap({
  events,
  eventsVisible,
  selectedEventId,
  onSelectEvent,
}: HistoricalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const eventsRef = useRef(events);
  const visibilityRef = useRef(eventsVisible);
  const selectedIdRef = useRef(selectedEventId);
  const selectHandlerRef = useRef(onSelectEvent);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    visibilityRef.current = eventsVisible;
  }, [eventsVisible]);

  useEffect(() => {
    selectedIdRef.current = selectedEventId;
  }, [selectedEventId]);

  useEffect(() => {
    selectHandlerRef.current = onSelectEvent;
  }, [onSelectEvent]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: createMapStyle(),
      ...MAP_INITIAL_VIEW,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-left");

    const handleMarkerClick = (event: MapLayerMouseEvent) => {
      const featureId = event.features?.[0]?.properties?.id;
      if (typeof featureId === "string") selectHandlerRef.current(featureId);
    };

    map.on("load", () => {
      map.addSource(EVENT_SOURCE_ID, { type: "geojson", data: eventsRef.current });
      map.addLayer({
        id: EVENT_LAYER_ID,
        source: EVENT_SOURCE_ID,
        type: "circle",
        layout: { visibility: visibilityRef.current ? "visible" : "none" },
        paint: {
          "circle-color": "#c99745",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 8, 9],
          "circle-stroke-color": "#17130e",
          "circle-stroke-width": 2,
        },
        filter: ["!=", ["get", "id"], selectedIdRef.current ?? ""],
      });
      map.addLayer({
        id: SELECTED_EVENT_LAYER_ID,
        source: EVENT_SOURCE_ID,
        type: "circle",
        layout: { visibility: visibilityRef.current ? "visible" : "none" },
        paint: {
          "circle-color": "#f8e3a7",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 9, 8, 14],
          "circle-stroke-color": "#c99745",
          "circle-stroke-width": 4,
          "circle-blur": 0.12,
        },
        filter: ["==", ["get", "id"], selectedIdRef.current ?? ""],
      });
      map.on("click", EVENT_LAYER_ID, handleMarkerClick);
      map.on("click", SELECTED_EVENT_LAYER_ID, handleMarkerClick);
      map.on("mouseenter", EVENT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", EVENT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource(EVENT_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(events);
  }, [events]);

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
    </div>
  );
}
