"""Public, source-preserving event detail schemas."""

from uuid import UUID

from pydantic import BaseModel


class EventTypeDetail(BaseModel):
    code: str
    name_ar: str
    name_en: str


class PlaceDetail(BaseModel):
    slug: str
    name_ar: str
    name_en: str | None = None


class PersonDetail(BaseModel):
    slug: str
    name_ar: str
    name_en: str | None = None


class StateDetail(BaseModel):
    slug: str
    name_ar: str
    name_en: str | None = None


class EventSourceDetail(BaseModel):
    title: str
    author: str | None = None
    edition: str | None = None
    publication_data: str | None = None
    url: str | None = None
    citation_locator: str | None = None
    support_type: str
    reliability_note: str | None = None


class EventDetail(BaseModel):
    id: UUID
    slug: str
    title_ar: str
    title_en: str | None = None
    date_display_ar: str
    date_display_en: str | None = None
    year_start_hijri: int
    year_end_hijri: int | None = None
    gregorian_reference: str | None = None
    event_type: EventTypeDetail | None = None
    summary_ar: str | None = None
    importance: int | None = None
    confidence: str | None = None
    primary_place: PlaceDetail | None = None
    related_people: list[PersonDetail]
    related_states: list[StateDetail]
    sources: list[EventSourceDetail]
