import type { TimelineStateResponse } from "../types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function fetchTimelineState(year: number, signal?: AbortSignal): Promise<TimelineStateResponse> {
  const response = await fetch(`${apiBaseUrl}/timeline/state?year_hijri=${year}`, { signal });
  if (!response.ok) throw new Error(`Timeline request failed with status ${response.status}`);
  const payload: unknown = await response.json();
  if (!isTimelineState(payload)) throw new Error("Timeline API returned an invalid state");
  return payload;
}

function isTimelineState(value: unknown): value is TimelineStateResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TimelineStateResponse>;
  return typeof candidate.year_hijri === "number" && Array.isArray(candidate.events)
    && candidate.event_features?.type === "FeatureCollection";
}
