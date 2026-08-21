import type {
  SearchBounds,
  SearchCoordinates,
  SearchResponse,
  SearchResult,
} from "../types";
import {
  MAX_SEARCH_QUERY_VISIBLE_CHARACTERS,
  MIN_SEARCH_QUERY_VISIBLE_CHARACTERS,
  prepareHistoricalSearchQuery,
} from "../search-query";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function searchHistoricalEntities(
  query: string,
  signal?: AbortSignal,
  limit = 10,
): Promise<SearchResponse> {
  const preparedQuery = prepareHistoricalSearchQuery(query);
  if (
    preparedQuery.visibleCharacterCount < MIN_SEARCH_QUERY_VISIBLE_CHARACTERS
    || preparedQuery.visibleCharacterCount > MAX_SEARCH_QUERY_VISIBLE_CHARACTERS
  ) {
    throw new RangeError("Search query length must be between 2 and 100 characters");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new RangeError("Search limit must be between 1 and 20");
  }

  const parameters = new URLSearchParams({ q: preparedQuery.query, limit: String(limit) });
  const response = await fetch(`${apiBaseUrl}/search?${parameters.toString()}`, { signal });
  if (!response.ok) throw new Error(`Search request failed with status ${response.status}`);

  const payload: unknown = await response.json();
  if (!isSearchResponse(payload, limit)) {
    throw new Error("Search API returned an invalid response");
  }
  return payload;
}

function isSearchResponse(value: unknown, limit: number): value is SearchResponse {
  return isRecord(value)
    && isNonEmptyString(value.query)
    && Array.isArray(value.results)
    && value.results.length <= limit
    && value.results.every(isSearchResult);
}

function isSearchResult(value: unknown): value is SearchResult {
  if (!isRecord(value)) return false;
  const entityType = value.entity_type;
  const startYear = value.relevant_hijri_year;
  const endYear = value.relevant_end_year;
  const coordinatesValid = value.coordinates === null || isCoordinates(value.coordinates);
  const boundsValid = value.bounds === null || isBounds(value.bounds);
  const navigationIdValid = value.navigation_event_id === null
    || isNonEmptyString(value.navigation_event_id);
  const navigationSlugValid = value.navigation_event_slug === null
    || isNonEmptyString(value.navigation_event_slug);
  const navigationPaired = (value.navigation_event_id === null)
    === (value.navigation_event_slug === null);

  if (!["event", "person", "place", "state"].includes(String(entityType))) return false;
  if (!coordinatesValid || !boundsValid || (value.coordinates !== null && value.bounds !== null)) {
    return false;
  }
  if (!navigationIdValid || !navigationSlugValid || !navigationPaired) return false;
  if ((entityType === "event" || entityType === "person") && value.navigation_event_slug === null) {
    return false;
  }

  return isNonEmptyString(value.id)
    && isNonEmptyString(value.slug)
    && isNonEmptyString(value.title_ar)
    && (value.title_en === null || isNonEmptyString(value.title_en))
    && isNonEmptyString(value.subtitle_ar)
    && Number.isInteger(startYear)
    && Number(startYear) > 0
    && (endYear === null || (Number.isInteger(endYear) && Number(endYear) >= Number(startYear)))
    && (value.confidence === null || isNonEmptyString(value.confidence));
}

function isCoordinates(value: unknown): value is SearchCoordinates {
  if (!isRecord(value)) return false;
  return isFiniteNumber(value.longitude)
    && value.longitude >= -180
    && value.longitude <= 180
    && isFiniteNumber(value.latitude)
    && value.latitude >= -90
    && value.latitude <= 90;
}

function isBounds(value: unknown): value is SearchBounds {
  if (!isRecord(value)) return false;
  return isFiniteNumber(value.west)
    && isFiniteNumber(value.east)
    && isFiniteNumber(value.south)
    && isFiniteNumber(value.north)
    && value.west >= -180
    && value.east <= 180
    && value.south >= -90
    && value.north <= 90
    && value.west <= value.east
    && value.south <= value.north;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
