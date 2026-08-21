"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchEventDetail } from "@/features/events/api/event-client";
import { EventDrawer } from "@/features/events/components/event-drawer";
import type {
  EventDetail,
  RelatedNavigationState,
  RelatedNavigationTarget,
} from "@/features/events/types";
import { searchHistoricalEntities } from "@/features/search/api/search-client";
import {
  SearchCommand,
  type SearchCommandHandle,
} from "@/features/search/components/search-command";
import type { SearchResult } from "@/features/search/types";
import { fetchTimelineState } from "@/features/timeline/api/timeline-client";
import { TimelineBar } from "@/features/timeline/components/timeline-bar";
import {
  type TimelineAction,
  useTimelineState,
} from "@/features/timeline/state/timeline-state";
import {
  TIMELINE_MAX_YEAR,
  TIMELINE_MIN_YEAR,
  type TimelineStateResponse,
} from "@/features/timeline/types";
import { useMapUiState } from "../state/map-ui-state";
import type {
  BoundaryFeatureCollection,
  EventFeatureCollection,
  MapDataState,
  MapFocusRequest,
} from "../types";
import { BoundaryDetails } from "./boundary-details";
import { HistoricalMap } from "./historical-map";
import { LayerPanel } from "./layer-panel";

const EMPTY_COLLECTION: EventFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};
const EMPTY_BOUNDARIES: BoundaryFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; detail: EventDetail };

interface DrawerTarget {
  restoreSearchFocus: boolean;
  slug: string;
}

interface PendingNavigation {
  relatedNavigationKey?: string;
  requestId: number;
  restoreSearchFocus: boolean;
  result: SearchResult;
  targetYear: number;
}

export function MapWorkspace() {
  const [uiState, dispatch] = useMapUiState();
  const [timelineState, timelineDispatch] = useTimelineState();
  const [retryKey, setRetryKey] = useState(0);
  const [mapData, setMapData] = useState<MapDataState>({
    status: "loading",
    data: EMPTY_COLLECTION,
  });
  const [boundaries, setBoundaries] = useState<BoundaryFeatureCollection>(EMPTY_BOUNDARIES);
  const [loadedTimeline, setLoadedTimeline] = useState<TimelineStateResponse | null>(null);
  const [detailRetryKey, setDetailRetryKey] = useState(0);
  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget | null>(null);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [selectedSearchContext, setSelectedSearchContext] = useState<SearchResult | null>(null);
  const [navigationAnnouncement, setNavigationAnnouncement] = useState("");
  const [relatedNavigationState, setRelatedNavigationState] = useState<RelatedNavigationState>({
    status: "idle",
  });
  const searchCommandRef = useRef<SearchCommandHandle>(null);
  const navigationRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const relatedNavigationRequestIdRef = useRef(0);
  const detailCacheRef = useRef(new Map<string, EventDetail>());
  const drawerTargetRef = useRef<DrawerTarget | null>(null);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);
  const relatedNavigationControllerRef = useRef<AbortController | null>(null);

  const updateDrawerTarget = useCallback((target: DrawerTarget | null) => {
    drawerTargetRef.current = target;
    setDrawerTarget(target);
  }, []);

  const openDrawer = useCallback((target: DrawerTarget) => {
    updateDrawerTarget(target);
    const cached = detailCacheRef.current.get(target.slug);
    setDetailState(cached ? { status: "ready", detail: cached } : { status: "loading" });
    setRelatedNavigationState({ status: "idle" });
  }, [updateDrawerTarget]);

  const cancelRelatedNavigation = useCallback(() => {
    relatedNavigationControllerRef.current?.abort();
    relatedNavigationControllerRef.current = null;
    relatedNavigationRequestIdRef.current += 1;
    setRelatedNavigationState({ status: "idle" });
  }, []);

  const applyPendingNavigation = useCallback((
    pending: PendingNavigation,
    timeline: TimelineStateResponse,
  ) => {
    if (pendingNavigationRef.current?.requestId !== pending.requestId) return;

    const { requestId, result } = pending;
    const navigationEventSlug = result.navigation_event_slug;
    const marker = navigationEventSlug
      ? timeline.event_features.features.find(
        (feature) => feature.properties.slug === navigationEventSlug,
      )
      : null;

    setFocusRequest(createFocusRequest(result, requestId));
    if (result.entity_type === "event" || result.entity_type === "person") {
      setSelectedSearchContext(null);
      dispatch({ type: "select-event", eventId: marker?.properties.id ?? null });
      if (navigationEventSlug) {
        openDrawer({
          restoreSearchFocus: pending.restoreSearchFocus,
          slug: navigationEventSlug,
        });
      } else {
        updateDrawerTarget(null);
        setDetailState(null);
      }
    } else {
      dispatch({ type: "select-event", eventId: null });
      updateDrawerTarget(null);
      setDetailState(null);
      setSelectedSearchContext(result);
    }

    setRelatedNavigationState({ status: "idle" });
    setNavigationAnnouncement(createNavigationAnnouncement(result, pending.targetYear));
    pendingNavigationRef.current = null;
  }, [dispatch, openDrawer, updateDrawerTarget]);

  useEffect(() => {
    const controller = new AbortController();
    const requestedYear = timelineState.selectedYear;

    fetchTimelineState(requestedYear, controller.signal)
      .then((data) => {
        if (controller.signal.aborted || data.year_hijri !== requestedYear) return;
        setLoadedTimeline(data);
        setBoundaries(data.boundaries);
        setMapData({ status: "ready", data: data.event_features });

        const pending = pendingNavigationRef.current;
        if (pending?.targetYear === requestedYear) {
          applyPendingNavigation(pending, data);
          return;
        }

        const currentDrawerTarget = drawerTargetRef.current;
        if (!currentDrawerTarget) return;
        const activeEvent = data.events.some(
          (event) => event.slug === currentDrawerTarget.slug,
        );
        const marker = data.event_features.features.find(
          (feature) => feature.properties.slug === currentDrawerTarget.slug,
        );
        if (!activeEvent && !marker) {
          updateDrawerTarget(null);
          setDetailState(null);
          dispatch({ type: "select-event", eventId: null });
          return;
        }
        dispatch({ type: "select-event", eventId: marker?.properties.id ?? null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const pending = pendingNavigationRef.current;
        if (pending?.targetYear === requestedYear) {
          pendingNavigationRef.current = null;
          if (pending.relatedNavigationKey) {
            setRelatedNavigationState({
              status: "error",
              key: pending.relatedNavigationKey,
            });
          }
        }
        setLoadedTimeline(null);
        setBoundaries(EMPTY_BOUNDARIES);
        setMapData({
          status: "error",
          data: EMPTY_COLLECTION,
          message: error instanceof Error ? error.message : "Unknown map error",
        });
      });

    return () => controller.abort();
  }, [
    applyPendingNavigation,
    dispatch,
    retryKey,
    timelineState.selectedYear,
    updateDrawerTarget,
  ]);

  useEffect(() => {
    if (!drawerTarget) return;
    const cached = detailCacheRef.current.get(drawerTarget.slug);
    if (cached) {
      setDetailState({ status: "ready", detail: cached });
      return;
    }
    const controller = new AbortController();
    const requestId = ++detailRequestIdRef.current;

    fetchEventDetail(drawerTarget.slug, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted || detailRequestIdRef.current !== requestId) return;
        detailCacheRef.current.set(drawerTarget.slug, detail);
        setDetailState({ status: "ready", detail });
      })
      .catch(() => {
        if (controller.signal.aborted || detailRequestIdRef.current !== requestId) return;
        setDetailState({ status: "error" });
      });

    return () => controller.abort();
  }, [detailRetryKey, drawerTarget]);

  const selectMarkerEvent = useCallback((eventId: string | null) => {
    cancelRelatedNavigation();
    pendingNavigationRef.current = null;
    setSelectedSearchContext(null);
    setNavigationAnnouncement("");

    if (!eventId) {
      updateDrawerTarget(null);
      setDetailState(null);
      dispatch({ type: "select-event", eventId: null });
      return;
    }

    const feature = mapData.data.features.find(
      (candidate) => candidate.properties.id === eventId,
    );
    if (!feature) return;

    const requestId = ++navigationRequestIdRef.current;
    setFocusRequest({
      requestId,
      kind: "point",
      coordinates: feature.geometry.coordinates,
    });
    openDrawer({ restoreSearchFocus: false, slug: feature.properties.slug });
    dispatch({ type: "select-event", eventId });
  }, [cancelRelatedNavigation, dispatch, mapData.data.features, openDrawer, updateDrawerTarget]);

  const selectSearchResult = useCallback((
    result: SearchResult,
    options?: {
      preserveDrawerUntilReady?: boolean;
      relatedNavigationKey?: string;
      restoreSearchFocus?: boolean;
    },
  ) => {
    cancelRelatedNavigation();
    const requestId = ++navigationRequestIdRef.current;
    const targetYear = clampTimelineYear(result.relevant_hijri_year);
    const preserveDrawer = Boolean(options?.preserveDrawerUntilReady && drawerTargetRef.current);
    const pending = {
      relatedNavigationKey: options?.relatedNavigationKey,
      requestId,
      restoreSearchFocus: options?.restoreSearchFocus ?? true,
      result,
      targetYear,
    };

    pendingNavigationRef.current = pending;
    if (!preserveDrawer) {
      updateDrawerTarget(null);
      setDetailState(null);
      dispatch({ type: "select-event", eventId: null });
      setFocusRequest(null);
    }
    setSelectedSearchContext(null);
    setNavigationAnnouncement("");
    if (targetYear !== timelineState.selectedYear) {
      setLoadedTimeline(null);
    } else if (loadedTimeline?.year_hijri === targetYear) {
      applyPendingNavigation(pending, loadedTimeline);
    } else if (mapData.status === "error") {
      setRetryKey((key) => key + 1);
    }
    timelineDispatch({ type: "navigate", year: targetYear });
  }, [
    applyPendingNavigation,
    cancelRelatedNavigation,
    dispatch,
    loadedTimeline,
    mapData.status,
    timelineDispatch,
    timelineState.selectedYear,
    updateDrawerTarget,
  ]);

  const dispatchTimelineAction = useCallback((action: TimelineAction) => {
    cancelRelatedNavigation();
    pendingNavigationRef.current = null;
    setSelectedSearchContext(null);
    setNavigationAnnouncement("");
    timelineDispatch(action);
  }, [cancelRelatedNavigation, timelineDispatch]);

  const navigateRelated = useCallback((target: RelatedNavigationTarget) => {
    relatedNavigationControllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = ++relatedNavigationRequestIdRef.current;
    const key = `${target.entityType}:${target.slug}`;
    relatedNavigationControllerRef.current = controller;
    setRelatedNavigationState({ status: "loading", key });

    searchHistoricalEntities(target.nameAr, controller.signal, 20)
      .then((response) => {
        if (controller.signal.aborted || requestId !== relatedNavigationRequestIdRef.current) return;
        const exactResult = response.results.find(
          (result) => result.entity_type === target.entityType && result.slug === target.slug,
        );
        if (!exactResult) throw new Error("Related historical entity was not resolved exactly");
        selectSearchResult(exactResult, {
          preserveDrawerUntilReady: true,
          relatedNavigationKey: key,
          restoreSearchFocus: drawerTargetRef.current?.restoreSearchFocus ?? false,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== relatedNavigationRequestIdRef.current) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        relatedNavigationControllerRef.current = null;
        setRelatedNavigationState({ status: "error", key });
      });
  }, [selectSearchResult]);

  const closeDrawer = useCallback(() => {
    cancelRelatedNavigation();
    pendingNavigationRef.current = null;
    const shouldRestoreSearchFocus = drawerTarget?.restoreSearchFocus ?? false;
    updateDrawerTarget(null);
    setDetailState(null);
    dispatch({ type: "select-event", eventId: null });
    if (shouldRestoreSearchFocus) {
      window.setTimeout(() => searchCommandRef.current?.focus(), 0);
    }
  }, [cancelRelatedNavigation, dispatch, drawerTarget?.restoreSearchFocus, updateDrawerTarget]);

  return (
    <section className="relative isolate min-h-[34rem] flex-1 overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[#121713] shadow-2xl">
      <HistoricalMap
        boundaries={boundaries}
        boundariesVisible={uiState.layers.boundaries}
        events={mapData.data}
        eventsVisible={uiState.layers.events}
        focusRequest={focusRequest}
        onSelectEvent={selectMarkerEvent}
        selectedEventId={uiState.selectedEventId}
      />

      <SearchCommand ref={searchCommandRef} onSelectResult={selectSearchResult} />

      <LayerPanel
        boundariesVisible={uiState.layers.boundaries}
        eventsVisible={uiState.layers.events}
        onToggleBoundaries={() => dispatch({ type: "toggle-boundaries" })}
        onToggleEvents={() => dispatch({ type: "toggle-events" })}
      />

      {uiState.layers.boundaries && <BoundaryDetails boundaries={boundaries} />}
      {selectedSearchContext && <SearchSelectionContext result={selectedSearchContext} />}

      <TimelineBar dispatch={dispatchTimelineAction} state={timelineState} />

      <p
        aria-label="إعلان التنقل التاريخي"
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {navigationAnnouncement}
      </p>

      {mapData.status === "loading" && (
        <MapNotice label="جارٍ تحميل بيانات الخريطة…" role="status" />
      )}
      {mapData.status === "error" && (
        <MapNotice label="تعذّر تحميل بيانات الخريطة التاريخية." role="alert">
          <button
            className="mt-3 rounded-lg border border-[var(--gold-primary)] px-3 py-1.5 text-xs text-[var(--gold-primary)]"
            onClick={() => {
              setMapData({ status: "loading", data: EMPTY_COLLECTION });
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

      {drawerTarget && detailState && (
        <EventDrawer
          onClose={closeDrawer}
          onNavigateRelated={navigateRelated}
          onRetry={() => {
            setDetailState({ status: "loading" });
            setDetailRetryKey((key) => key + 1);
          }}
          relatedNavigationState={relatedNavigationState}
          state={detailState}
          targetSlug={drawerTarget.slug}
        />
      )}
    </section>
  );
}

function SearchSelectionContext({ result }: { result: SearchResult }) {
  const typeLabel = result.entity_type === "place" ? "مكان تاريخي" : "دولة تاريخية";
  return (
    <aside
      aria-label="سياق نتيجة البحث التاريخي"
      className="absolute bottom-32 start-4 z-10 w-72 max-w-[calc(100%-2rem)] rounded-2xl border border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/95 p-4 shadow-2xl backdrop-blur"
      dir="rtl"
    >
      <p className="text-[10px] font-semibold tracking-wide text-[var(--gold-primary)]">
        {typeLabel}
      </p>
      <h2 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
        {result.title_ar}
      </h2>
      {result.title_en && (
        <p className="mt-0.5 text-xs text-[var(--text-muted)]" dir="ltr">
          {result.title_en}
        </p>
      )}
      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
        {result.subtitle_ar}
      </p>
      <p className="mt-2 text-xs text-[var(--text-primary)]">
        السنة المرتبطة: <bdi dir="ltr">{result.relevant_hijri_year}هـ</bdi>
      </p>
    </aside>
  );
}

function createFocusRequest(
  result: SearchResult,
  requestId: number,
): MapFocusRequest | null {
  if (result.coordinates) {
    return {
      requestId,
      kind: "point",
      coordinates: [result.coordinates.longitude, result.coordinates.latitude],
    };
  }
  if (result.bounds) {
    return {
      requestId,
      kind: "bounds",
      bounds: [
        [result.bounds.west, result.bounds.south],
        [result.bounds.east, result.bounds.north],
      ],
    };
  }
  return null;
}

function createNavigationAnnouncement(result: SearchResult, year: number) {
  const spatialMessage = result.coordinates || result.bounds
    ? " وتم تحديث نطاق الخريطة."
    : "، ولا تتوفر له هندسة مكانية منشورة.";
  return `تم الانتقال إلى ${result.title_ar} في ${year}هـ${spatialMessage}`;
}

function clampTimelineYear(year: number) {
  return Math.min(TIMELINE_MAX_YEAR, Math.max(TIMELINE_MIN_YEAR, year));
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
