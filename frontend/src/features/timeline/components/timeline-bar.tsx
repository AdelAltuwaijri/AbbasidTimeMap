"use client";

import { useEffect } from "react";

import { TIMELINE_MAX_YEAR, TIMELINE_MIN_YEAR } from "../types";
import type { TimelineAction, TimelineUiState } from "../state/timeline-state";

interface Props { state: TimelineUiState; dispatch: (action: TimelineAction) => void }

export function TimelineBar({ state, dispatch }: Props) {
  useEffect(() => {
    if (!state.isPlaying) return;
    const timer = window.setInterval(() => dispatch({ type: "next" }), 1000);
    return () => window.clearInterval(timer);
  }, [dispatch, state.isPlaying]);

  return <section aria-label="شريط الزمن" className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/95 p-3 shadow-xl backdrop-blur" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs text-[var(--text-muted)]">السنة الهجرية المختارة</p><output className="text-xl font-semibold text-[var(--gold-primary)]" aria-live="polite">{state.selectedYear}هـ</output></div>
      <div className="flex items-center gap-2">
        <button aria-label="السنة السابقة" disabled={state.selectedYear === TIMELINE_MIN_YEAR} onClick={() => dispatch({ type: "previous" })} type="button">السابق</button>
        <button aria-label="السنة التالية" disabled={state.selectedYear === TIMELINE_MAX_YEAR} onClick={() => dispatch({ type: "next" })} type="button">التالي</button>
        <button aria-label={state.isPlaying ? "إيقاف التشغيل" : "تشغيل"} onClick={() => dispatch({ type: state.isPlaying ? "pause" : "play" })} type="button">{state.isPlaying ? "إيقاف" : "تشغيل"}</button>
      </div>
    </div>
    <input aria-label="اختيار السنة الهجرية" className="mt-3 w-full accent-[var(--gold-primary)]" min={TIMELINE_MIN_YEAR} max={TIMELINE_MAX_YEAR} onChange={(event) => dispatch({ type: "set-year", year: Number(event.target.value) })} type="range" value={state.selectedYear} />
  </section>;
}
