import { useReducer } from "react";

export interface MapUiState {
  layers: {
    boundaries: boolean;
    events: boolean;
  };
  selectedEventId: string | null;
}

type MapUiAction =
  | { type: "toggle-boundaries" }
  | { type: "toggle-events" }
  | { type: "select-event"; eventId: string | null };

export const initialMapUiState: MapUiState = {
  layers: {
    boundaries: true,
    events: true,
  },
  selectedEventId: null,
};

export function mapUiReducer(state: MapUiState, action: MapUiAction): MapUiState {
  switch (action.type) {
    case "toggle-boundaries":
      return {
        ...state,
        layers: { ...state.layers, boundaries: !state.layers.boundaries },
      };
    case "toggle-events":
      return {
        ...state,
        layers: { ...state.layers, events: !state.layers.events },
      };
    case "select-event":
      return { ...state, selectedEventId: action.eventId };
  }
}

export function useMapUiState() {
  return useReducer(mapUiReducer, initialMapUiState);
}
