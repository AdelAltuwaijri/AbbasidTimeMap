import { useReducer } from "react";

import { TIMELINE_MAX_YEAR, TIMELINE_MIN_YEAR } from "../types";

export interface TimelineUiState { selectedYear: number; isPlaying: boolean }
export type TimelineAction =
  | { type: "set-year"; year: number }
  | { type: "navigate"; year: number }
  | { type: "previous" }
  | { type: "next" }
  | { type: "play" }
  | { type: "pause" };

export function timelineReducer(state: TimelineUiState, action: TimelineAction): TimelineUiState {
  if (action.type === "pause") return { ...state, isPlaying: false };
  if (action.type === "play") return state.selectedYear >= TIMELINE_MAX_YEAR ? state : { ...state, isPlaying: true };
  if (action.type === "navigate") {
    return {
      selectedYear: Math.min(TIMELINE_MAX_YEAR, Math.max(TIMELINE_MIN_YEAR, action.year)),
      isPlaying: false,
    };
  }
  const selectedYear = action.type === "previous" ? Math.max(TIMELINE_MIN_YEAR, state.selectedYear - 1)
    : action.type === "next" ? Math.min(TIMELINE_MAX_YEAR, state.selectedYear + 1)
    : Math.min(TIMELINE_MAX_YEAR, Math.max(TIMELINE_MIN_YEAR, action.year));
  return { selectedYear, isPlaying: selectedYear >= TIMELINE_MAX_YEAR ? false : state.isPlaying };
}

export function useTimelineState() {
  return useReducer(timelineReducer, { selectedYear: TIMELINE_MIN_YEAR, isPlaying: false });
}
