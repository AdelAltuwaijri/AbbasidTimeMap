import type { EventFeatureCollection } from "../types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function fetchEventFeatures(
  signal?: AbortSignal,
): Promise<EventFeatureCollection> {
  const response = await fetch(`${apiBaseUrl}/map/events`, { signal });

  if (!response.ok) {
    throw new Error(`Map request failed with status ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isEventFeatureCollection(payload)) {
    throw new Error("Map API returned an invalid GeoJSON collection");
  }

  return payload;
}

function isEventFeatureCollection(value: unknown): value is EventFeatureCollection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EventFeatureCollection>;
  return candidate.type === "FeatureCollection" && Array.isArray(candidate.features);
}
