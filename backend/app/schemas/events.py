"""Public, source-preserving event detail schemas."""

from typing import Annotated, Literal
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, Field, model_validator

HistoricalCalendar = Literal["hijri", "gregorian", "mixed_reference"]
HistoricalDatePrecision = Literal["exact", "month", "year", "approximate", "disputed"]
HistoricalConfidence = Literal[
    "high",
    "medium",
    "disputed",
    "legendary/late-tradition",
]
PublicHttpUrl = Annotated[
    AnyHttpUrl,
    Field(json_schema_extra={"pattern": "^https?://"}),
]


class EventTypeDetail(BaseModel):
    code: str
    name_ar: str
    name_en: str


class HistoricalDateDetail(BaseModel):
    calendar: HistoricalCalendar
    year: int = Field(ge=1)
    month: int | None = Field(default=None, ge=1, le=12)
    day: int | None = Field(default=None, ge=1, le=31)
    precision: HistoricalDatePrecision
    circa: bool
    display_label_ar: str | None = None
    display_label_en: str | None = None

    @model_validator(mode="after")
    def validate_precision_components(self) -> "HistoricalDateDetail":
        """Keep structured components consistent with the declared precision."""

        if self.day is not None and self.month is None:
            raise ValueError("day requires month")
        if self.precision == "exact" and (self.month is None or self.day is None):
            raise ValueError("exact precision requires month and day")
        if self.precision == "month" and (self.month is None or self.day is not None):
            raise ValueError("month precision requires month and forbids day")
        if self.precision == "year" and (self.month is not None or self.day is not None):
            raise ValueError("year precision forbids month and day")
        return self


class PlaceDetail(BaseModel):
    id: UUID
    slug: str
    name_ar: str
    name_en: str | None = None


class RelatedPlaceDetail(PlaceDetail):
    relation_type: str


class PersonDetail(BaseModel):
    id: UUID
    slug: str
    name_ar: str
    name_en: str | None = None
    role_code: str


class StateDetail(BaseModel):
    id: UUID
    slug: str
    name_ar: str
    name_en: str | None = None
    relation_type: str


class EventSourceDetail(BaseModel):
    id: UUID
    source_type: str
    title: str
    author: str | None = None
    edition: str | None = None
    publication_data: str | None = None
    url: PublicHttpUrl | None = None
    citation_locator: str | None = None
    support_type: str
    reliability_note: str | None = None


class EventDetail(BaseModel):
    id: UUID
    slug: str
    title_ar: str
    title_en: str | None = None
    start_date: HistoricalDateDetail
    end_date: HistoricalDateDetail | None = None
    date_display_ar: str
    date_display_en: str | None = None
    year_start_hijri: int
    year_end_hijri: int | None = None
    gregorian_reference: str | None = None
    event_type: EventTypeDetail | None = None
    summary_ar: str | None = None
    summary_en: str | None = None
    causes_ar: str | None = None
    consequences_ar: str | None = None
    importance: int | None = Field(default=None, ge=1, le=5)
    confidence: HistoricalConfidence
    primary_place: PlaceDetail | None = None
    related_people: list[PersonDetail]
    related_places: list[RelatedPlaceDetail]
    related_states: list[StateDetail]
    sources: list[EventSourceDetail] = Field(min_length=1)
