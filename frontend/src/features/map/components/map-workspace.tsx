"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchEventFeatures } from "../api/map-client";
import { useMapUiState } from "../state/map-ui-state";
import type { EventFeatureCollection, MapDataState } from "../types";
import { HistoricalMap } from "./historical-map";
import { LayerPanel } from "./layer-panel";

const EMPTY_COLLECTION: EventFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function MapWorkspace() {
  const [uiState, dispatch] = useMapUiState();
  const [requestKey, setRequestKey] = useState(0);
  const [mapData, setMapData] = useState<MapDataState>({
    status: "loading",
    data: EMPTY_COLLECTION,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetchEventFeatures(controller.signal)
      .then((data) => setMapData({ status: "ready", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setMapData({
          status: "error",
          data: EMPTY_COLLECTION,
          message: error instanceof Error ? error.message : "Unknown map error",
        });
      });

    return () => controller.abort();
  }, [requestKey]);

  const selectedEvent = useMemo(
    () =>
      mapData.data.features.find(
        (feature) => feature.properties.id === uiState.selectedEventId,
      ) ?? null,
    [mapData.data.features, uiState.selectedEventId],
  );

  const selectEvent = useCallback((eventId: string | null) => {
    dispatch({ type: "select-event", eventId });
  }, [dispatch]);

  return (
    <section className="relative isolate min-h-[34rem] flex-1 overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[#121713] shadow-2xl">
      <HistoricalMap
        events={mapData.data}
        eventsVisible={uiState.layers.events}
        onSelectEvent={selectEvent}
        selectedEventId={uiState.selectedEventId}
      />

      <LayerPanel
        eventsVisible={uiState.layers.events}
        onToggleEvents={() => dispatch({ type: "toggle-events" })}
      />

      {mapData.status === "loading" && (
        <MapNotice label="جارٍ تحميل بيانات الخريطة…" role="status" />
      )}
      {mapData.status === "error" && (
        <MapNotice label="تعذّر تحميل بيانات الأحداث." role="alert">
          <button
            className="mt-3 rounded-lg border border-[var(--gold-primary)] px-3 py-1.5 text-xs text-[var(--gold-primary)]"
            onClick={() => {
              setMapData({ status: "loading", data: EMPTY_COLLECTION });
              setRequestKey((key) => key + 1);
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

      {selectedEvent && (
        <article className="absolute bottom-4 start-4 z-10 max-w-sm rounded-2xl border border-[var(--gold-primary)]/60 bg-[color:var(--background-elevated)]/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="mb-1 text-[10px] tracking-widest text-[var(--gold-primary)]" dir="ltr">
                SELECTED EVENT
              </p>
              <h2 className="font-semibold text-[var(--text-primary)]">
                {selectedEvent.properties.title_ar}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {formatHijriRange(
                  selectedEvent.properties.year_start_hijri,
                  selectedEvent.properties.year_end_hijri,
                )}
              </p>
            </div>
            <button
              aria-label="إلغاء تحديد الحدث"
              className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              onClick={() => selectEvent(null)}
              type="button"
            >
              ×
            </button>
          </div>
        </article>
      )}
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

function formatHijriRange(start: number, end: number | null) {
  return end && end !== start ? `${start}–${end} هـ` : `${start} هـ`;
}
