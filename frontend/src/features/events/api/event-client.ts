import type {
  EventDetail,
  EventSourceDetail,
  HistoricalDateDetail,
  NamedEventEntity,
  RelatedPerson,
  RelatedPlace,
  RelatedState,
} from "../types";
import { safeHttpUrl } from "../utils/safe-http-url";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CALENDARS = new Set(["hijri", "gregorian", "mixed_reference"]);
const DATE_PRECISIONS = new Set(["exact", "month", "year", "approximate", "disputed"]);
const PUBLIC_CONFIDENCE_LEVELS = new Set([
  "high",
  "medium",
  "disputed",
  "legendary/late-tradition",
]);

export async function fetchEventDetail(slug: string, signal?: AbortSignal): Promise<EventDetail> {
  const response = await fetch(`${apiBaseUrl}/events/${encodeURIComponent(slug)}`, { signal });
  if (!response.ok) throw new Error(`Event detail request failed with status ${response.status}`);
  const payload: unknown = await response.json();
  if (!isEventDetail(payload)) throw new Error("Event detail API returned an invalid response");
  return payload;
}

function isEventDetail(value: unknown): value is EventDetail {
  if (!isRecord(value)) return false;

  return isUuid(value.id)
    && isNonEmptyString(value.slug)
    && isNonEmptyString(value.title_ar)
    && isNullableString(value.title_en)
    && isHistoricalDate(value.start_date)
    && (value.end_date === null || isHistoricalDate(value.end_date))
    && isNonEmptyString(value.date_display_ar)
    && isNullableString(value.date_display_en)
    && Number.isInteger(value.year_start_hijri)
    && Number(value.year_start_hijri) === value.start_date.year
    && isNullableInteger(value.year_end_hijri)
    && isDateRangeConsistent(value)
    && isNullableString(value.gregorian_reference)
    && (value.event_type === null || isEventType(value.event_type))
    && isNullableString(value.summary_ar)
    && isNullableString(value.summary_en)
    && isNullableString(value.causes_ar)
    && isNullableString(value.consequences_ar)
    && (value.importance === null
      || (Number.isInteger(value.importance) && Number(value.importance) >= 1 && Number(value.importance) <= 5))
    && typeof value.confidence === "string"
    && PUBLIC_CONFIDENCE_LEVELS.has(value.confidence)
    && (value.primary_place === null || isNamedEntity(value.primary_place))
    && Array.isArray(value.related_people)
    && value.related_people.every(isRelatedPerson)
    && Array.isArray(value.related_places)
    && value.related_places.every(isRelatedPlace)
    && Array.isArray(value.related_states)
    && value.related_states.every(isRelatedState)
    && Array.isArray(value.sources)
    && value.sources.length > 0
    && value.sources.every(isEventSource);
}

function isHistoricalDate(value: unknown): value is HistoricalDateDetail {
  if (!isRecord(value)) return false;
  const year = value.year;
  const month = value.month;
  const day = value.day;
  const precision = value.precision;

  if (!CALENDARS.has(String(value.calendar))
    || !Number.isInteger(year)
    || Number(year) <= 0
    || !DATE_PRECISIONS.has(String(precision))
    || typeof value.circa !== "boolean"
    || !isNullableString(value.display_label_ar)
    || !isNullableString(value.display_label_en)
    || !(month === null || (Number.isInteger(month) && Number(month) >= 1 && Number(month) <= 12))
    || !(day === null || (Number.isInteger(day) && Number(day) >= 1 && Number(day) <= 31))) {
    return false;
  }
  if (precision === "exact" && (month === null || day === null)) return false;
  if (precision === "month" && (month === null || day !== null)) return false;
  if (precision === "year" && (month !== null || day !== null)) return false;
  return true;
}

function isDateRangeConsistent(value: Record<string, unknown>) {
  const endDate = value.end_date as HistoricalDateDetail | null;
  const endYear = value.year_end_hijri;
  if (endDate === null) return endYear === null;
  return Number.isInteger(endYear)
    && Number(endYear) === endDate.year
    && endDate.year >= Number(value.year_start_hijri);
}

function isEventType(value: unknown) {
  return isRecord(value)
    && isNonEmptyString(value.code)
    && isNonEmptyString(value.name_ar)
    && isNonEmptyString(value.name_en);
}

function isNamedEntity(value: unknown): value is NamedEventEntity {
  return isRecord(value)
    && isUuid(value.id)
    && isNonEmptyString(value.slug)
    && isNonEmptyString(value.name_ar)
    && isNullableString(value.name_en);
}

function isRelatedPerson(value: unknown): value is RelatedPerson {
  return isNamedEntity(value)
    && "role_code" in value
    && typeof value.role_code === "string";
}

function isRelatedPlace(value: unknown): value is RelatedPlace {
  return isNamedEntity(value)
    && "relation_type" in value
    && isNonEmptyString(value.relation_type);
}

function isRelatedState(value: unknown): value is RelatedState {
  return isNamedEntity(value)
    && "relation_type" in value
    && isNonEmptyString(value.relation_type);
}

function isEventSource(value: unknown): value is EventSourceDetail {
  return isRecord(value)
    && isUuid(value.id)
    && isNonEmptyString(value.source_type)
    && isNonEmptyString(value.title)
    && isNullableString(value.author)
    && isNullableString(value.edition)
    && isNullableString(value.publication_data)
    && isNullableString(value.citation_locator)
    && isNonEmptyString(value.support_type)
    && isNullableString(value.reliability_note)
    && (value.url === null || (isNonEmptyString(value.url) && safeHttpUrl(value.url) !== null));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isNullableInteger(value: unknown): value is number | null {
  return value === null || Number.isInteger(value);
}
