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

export type MapDataState =
  | { status: "loading"; data: EventFeatureCollection }
  | { status: "ready"; data: EventFeatureCollection }
  | { status: "error"; data: EventFeatureCollection; message: string };
