import type { BoundaryFeatureCollection, EventFeatureCollection } from "@/features/map/types";

export const TIMELINE_MIN_YEAR = 132;
export const TIMELINE_MAX_YEAR = 170;

export interface TimelineEventSummary {
  id: string;
  slug: string;
  title_ar: string;
  event_type: string | null;
  year_start_hijri: number;
  year_end_hijri: number | null;
  importance: number | null;
  confidence: string | null;
}

export interface TimelineStateResponse {
  year_hijri: number;
  metadata: { calendar: "hijri"; granularity: "year" };
  events: TimelineEventSummary[];
  event_features: EventFeatureCollection;
  boundaries: BoundaryFeatureCollection;
}
