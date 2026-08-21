"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchTimelineState } from "@/features/timeline/api/timeline-client";
import { TimelineBar } from "@/features/timeline/components/timeline-bar";
import { useTimelineState } from "@/features/timeline/state/timeline-state";
import { fetchEventDetail } from "@/features/events/api/event-client";
import { EventDrawer } from "@/features/events/components/event-drawer";
import type { EventDetail } from "@/features/events/types";
import { useMapUiState } from "../state/map-ui-state";
import type { BoundaryFeatureCollection, EventFeatureCollection, MapDataState } from "../types";
import { BoundaryDetails } from "./boundary-details";
import { HistoricalMap } from "./historical-map";
import { LayerPanel } from "./layer-panel";

const EMPTY_COLLECTION: EventFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};
const EMPTY_BOUNDARIES: BoundaryFeatureCollection = { type: "FeatureCollection", features: [] };

export function MapWorkspace() {
  const [uiState, dispatch] = useMapUiState();
  const [timelineState, timelineDispatch] = useTimelineState();
  const [retryKey, setRetryKey] = useState(0);
  const [mapData, setMapData] = useState<MapDataState>({
    status: "loading",
    data: EMPTY_COLLECTION,
  });
  const [boundaries, setBoundaries] = useState<BoundaryFeatureCollection>(EMPTY_BOUNDARIES);
  const [detailRetryKey, setDetailRetryKey] = useState(0);
  const [detailState, setDetailState] = useState<{ status: "loading" } | { status: "error" } | { status: "ready"; detail: EventDetail } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchTimelineState(timelineState.selectedYear, controller.signal)
      .then((data) => { setBoundaries(data.boundaries); setMapData({ status: "ready", data: data.event_features }); })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setBoundaries(EMPTY_BOUNDARIES);
        setMapData((currentMapData) => ({
          status: "error",
          data: currentMapData.data,
          message: error instanceof Error ? error.message : "Unknown map error",
        }));
      });

    return () => controller.abort();
  // The selected Hijri year is the sole time input. Abort stale requests as it changes.
  }, [retryKey, timelineState.selectedYear]);

  useEffect(() => {
    if (uiState.selectedEventId && !mapData.data.features.some((feature) => feature.properties.id === uiState.selectedEventId)) {
      dispatch({ type: "select-event", eventId: null });
    }
  }, [dispatch, mapData.data.features, uiState.selectedEventId]);

  const selectedEvent = useMemo(
    () =>
      mapData.data.features.find(
        (feature) => feature.properties.id === uiState.selectedEventId,
      ) ?? null,
    [mapData.data.features, uiState.selectedEventId],
  );

  useEffect(() => {
    if (!selectedEvent) return;
    const controller = new AbortController();
    fetchEventDetail(selectedEvent.properties.slug, controller.signal)
      .then((detail) => setDetailState({ status: "ready", detail }))
      .catch(() => { if (!controller.signal.aborted) setDetailState({ status: "error" }); });
    return () => controller.abort();
  }, [detailRetryKey, selectedEvent]);

  const selectEvent = useCallback((eventId: string | null) => {
    setDetailState(eventId ? { status: "loading" } : null);
    dispatch({ type: "select-event", eventId });
  }, [dispatch]);

  return (
    <section className="relative isolate min-h-[34rem] flex-1 overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[#121713] shadow-2xl">
      <HistoricalMap
        boundaries={boundaries}
        boundariesVisible={uiState.layers.boundaries}
        events={mapData.data}
        eventsVisible={uiState.layers.events}
        onSelectEvent={selectEvent}
        selectedEventId={uiState.selectedEventId}
      />

      <LayerPanel
        boundariesVisible={uiState.layers.boundaries}
        eventsVisible={uiState.layers.events}
        onToggleBoundaries={() => dispatch({ type: "toggle-boundaries" })}
        onToggleEvents={() => dispatch({ type: "toggle-events" })}
      />

      {uiState.layers.boundaries && <BoundaryDetails boundaries={boundaries} />}

      <TimelineBar dispatch={timelineDispatch} state={timelineState} />

      {mapData.status === "loading" && (
        <MapNotice label="جارٍ تحميل بيانات الخريطة…" role="status" />
      )}
      {mapData.status === "error" && (
        <MapNotice label="تعذّر تحميل بيانات الخريطة التاريخية." role="alert">
          <button
            className="mt-3 rounded-lg border border-[var(--gold-primary)] px-3 py-1.5 text-xs text-[var(--gold-primary)]"
            onClick={() => {
              setMapData((currentMapData) => ({ status: "loading", data: currentMapData.data }));
              setRetryKey((key) => key + 1);
            }}
            type="button"
          >
            إعادة المحاولة
          </button>
        </MapNotice>
      )}
      {mapData.status === "ready" && mapData.data.features.length === 0 && (
        <MapNotice label="لا توجد أحداث جغرافية منشورة بعد." role="status" />
      )}

      {selectedEvent && detailState && <EventDrawer onClose={() => { setDetailState(null); selectEvent(null); }} onRetry={() => { setDetailState({ status: "loading" }); setDetailRetryKey((key) => key + 1); }} state={detailState} />}
    </section>
  );
}

function MapNotice({
  children,
  label,
  role,
}: {
  children?: React.ReactNode;
  label: string;
  role: "alert" | "status";
}) {
  return (
    <div
      className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/95 px-5 py-3 text-center text-sm text-[var(--text-primary)] shadow-xl backdrop-blur"
      role={role}
    >
      {label}
      {children}
    </div>
  );
}
