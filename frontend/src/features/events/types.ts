export interface EventSourceDetail {
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
  date_display_ar: string;
  date_display_en: string | null;
  year_start_hijri: number;
  year_end_hijri: number | null;
  gregorian_reference: string | null;
  event_type: { code: string; name_ar: string; name_en: string } | null;
  summary_ar: string | null;
  importance: number | null;
  confidence: string | null;
  primary_place: { slug: string; name_ar: string; name_en: string | null } | null;
  related_people: { slug: string; name_ar: string; name_en: string | null }[];
  related_states: { slug: string; name_ar: string; name_en: string | null }[];
  sources: EventSourceDetail[];
}
