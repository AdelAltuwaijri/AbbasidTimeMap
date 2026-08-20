import type { EventDetail } from "../types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function fetchEventDetail(slug: string, signal?: AbortSignal): Promise<EventDetail> {
  const response = await fetch(`${apiBaseUrl}/events/${encodeURIComponent(slug)}`, { signal });
  if (!response.ok) throw new Error(`Event detail request failed with status ${response.status}`);
  const payload: unknown = await response.json();
  if (!isEventDetail(payload)) throw new Error("Event detail API returned an invalid response");
  return payload;
}

function isEventDetail(value: unknown): value is EventDetail {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<EventDetail>;
  return typeof event.id === "string" && typeof event.slug === "string"
    && typeof event.title_ar === "string" && typeof event.date_display_ar === "string"
    && Array.isArray(event.sources);
}
