import type {
  BoundaryFeature,
  BoundaryFeatureProperties,
} from "@/features/map/types";
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
  if (!isRecord(value)) return false;
  return typeof value.year_hijri === "number"
    && isTimelineMetadata(value.metadata)
    && Array.isArray(value.events)
    && isFeatureCollection(value.event_features)
    && isBoundaryFeatureCollection(value.boundaries);
}

function isTimelineMetadata(value: unknown): boolean {
  return isRecord(value)
    && value.calendar === "hijri"
    && value.granularity === "year";
}

function isFeatureCollection(value: unknown): boolean {
  return isRecord(value)
    && value.type === "FeatureCollection"
    && Array.isArray(value.features);
}

function isBoundaryFeatureCollection(value: unknown): boolean {
  return isFeatureCollection(value)
    && (value as { features: unknown[] }).features.every(isBoundaryFeature);
}

function isBoundaryFeature(value: unknown): value is BoundaryFeature {
  if (!isRecord(value) || value.type !== "Feature" || typeof value.id !== "string") {
    return false;
  }
  if (!isRecord(value.geometry)
    || !["Polygon", "MultiPolygon"].includes(String(value.geometry.type))
    || !Array.isArray(value.geometry.coordinates)
    || value.geometry.coordinates.length === 0) {
    return false;
  }
  return isBoundaryFeatureProperties(value.properties);
}

function isBoundaryFeatureProperties(value: unknown): value is BoundaryFeatureProperties {
  if (!isRecord(value)) return false;
  const validFrom = value.valid_from_hijri;
  const validTo = value.valid_to_hijri;
  const sourceCount = value.source_count;
  return typeof value.boundary_slug === "string"
    && typeof value.state_id === "string"
    && typeof value.state_slug === "string"
    && typeof value.state_name_ar === "string"
    && typeof validFrom === "number"
    && typeof validTo === "number"
    && validFrom <= validTo
    && typeof value.confidence === "string"
    && typeof value.spatial_precision === "string"
    && typeof sourceCount === "number"
    && Number.isInteger(sourceCount)
    && sourceCount > 0
    && typeof value.primary_source_title === "string"
    && (typeof value.primary_source_url === "string" || value.primary_source_url === null)
    && typeof value.reconstruction_note_ar === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
