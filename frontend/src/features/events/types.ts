export type HistoricalCalendar = "hijri" | "gregorian" | "mixed_reference";

export type HistoricalDatePrecision =
  | "exact"
  | "month"
  | "year"
  | "approximate"
  | "disputed";

export interface HistoricalDateDetail {
  calendar: HistoricalCalendar;
  year: number;
  month: number | null;
  day: number | null;
  precision: HistoricalDatePrecision;
  circa: boolean;
  display_label_ar: string | null;
  display_label_en: string | null;
}

export interface NamedEventEntity {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
}

export interface RelatedPerson extends NamedEventEntity {
  role_code: string;
}

export interface RelatedPlace extends NamedEventEntity {
  relation_type: string;
}

export interface RelatedState extends NamedEventEntity {
  relation_type: string;
}

export interface EventSourceDetail {
  id: string;
  source_type: string;
  title: string;
  author: string | null;
  edition: string | null;
  publication_data: string | null;
  url: string | null;
  citation_locator: string | null;
  support_type: string;
  reliability_note: string | null;
}

export interface EventDetail {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  start_date: HistoricalDateDetail;
  end_date: HistoricalDateDetail | null;
  date_display_ar: string;
  date_display_en: string | null;
  year_start_hijri: number;
  year_end_hijri: number | null;
  gregorian_reference: string | null;
  event_type: { code: string; name_ar: string; name_en: string } | null;
  summary_ar: string | null;
  summary_en: string | null;
  causes_ar: string | null;
  consequences_ar: string | null;
  importance: number | null;
  confidence: string;
  primary_place: NamedEventEntity | null;
  related_people: RelatedPerson[];
  related_places: RelatedPlace[];
  related_states: RelatedState[];
  sources: EventSourceDetail[];
}

export type RelatedNavigationTarget =
  | { entityType: "person"; nameAr: string; slug: string }
  | { entityType: "state"; nameAr: string; slug: string };

export type RelatedNavigationState =
  | { status: "idle" }
  | { status: "loading"; key: string }
  | { status: "error"; key: string };
