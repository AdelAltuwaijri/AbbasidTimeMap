export type Position = [longitude: number, latitude: number];

export interface EventFeatureProperties {
  id: string;
  slug: string;
  title_ar: string;
  entity_type: "event";
  event_type: string | null;
  year_start_hijri: number;
  year_end_hijri: number | null;
  importance: number | null;
  confidence: string | null;
}

export interface EventFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: Position;
  };
  properties: EventFeatureProperties;
}

export interface EventFeatureCollection {
  type: "FeatureCollection";
  features: EventFeature[];
}

export interface BoundaryFeatureProperties {
  boundary_slug: string;
  state_id: string;
  state_slug: string;
  state_name_ar: string;
  valid_from_hijri: number;
  valid_to_hijri: number;
  confidence: string;
  spatial_precision: string;
  source_count: number;
  primary_source_title: string;
  primary_source_url: string | null;
  reconstruction_note_ar: string;
}

export interface BoundaryFeature {
  type: "Feature";
  id: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: BoundaryFeatureProperties;
}

export interface BoundaryFeatureCollection {
  type: "FeatureCollection";
  features: BoundaryFeature[];
}

export type MapDataState =
  | { status: "loading"; data: EventFeatureCollection }
  | { status: "ready"; data: EventFeatureCollection }
  | { status: "error"; data: EventFeatureCollection; message: string };
