export type SearchEntityType = "event" | "person" | "place" | "state";

export interface SearchCoordinates {
  longitude: number;
  latitude: number;
}

export interface SearchBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface SearchResult {
  entity_type: SearchEntityType;
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  subtitle_ar: string;
  relevant_hijri_year: number;
  relevant_end_year: number | null;
  coordinates: SearchCoordinates | null;
  bounds: SearchBounds | null;
  confidence: string | null;
  navigation_event_id: string | null;
  navigation_event_slug: string | null;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}
