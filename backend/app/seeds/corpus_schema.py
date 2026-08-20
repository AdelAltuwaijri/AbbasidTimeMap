"""Strict structured-data schemas for the reviewed M-01 corpus."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

Calendar = Literal["hijri", "gregorian", "mixed_reference"]
Precision = Literal["exact", "month", "year", "approximate", "disputed"]
Confidence = Literal["high", "medium", "disputed", "legendary/late-tradition"]
Publication = Literal["draft", "reviewed", "published", "archived"]


class SeedModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SeedHistoricalDate(SeedModel):
    calendar: Calendar = "hijri"
    year: int
    month: int | None = Field(default=None, ge=1, le=12)
    day: int | None = Field(default=None, ge=1, le=31)
    precision: Precision
    circa: bool = False
    display_label_ar: str = Field(min_length=1)
    display_label_en: str | None = None

    @model_validator(mode="after")
    def validate_precision(self) -> SeedHistoricalDate:
        if self.day is not None and self.month is None:
            raise ValueError("a historical day requires a month")
        if self.precision == "exact" and (self.month is None or self.day is None):
            raise ValueError("exact historical dates require month and day")
        if self.precision == "month" and (self.month is None or self.day is not None):
            raise ValueError("month precision requires month and forbids day")
        if self.precision == "year" and (self.month is not None or self.day is not None):
            raise ValueError("year precision forbids month and day")
        return self


class SeedEventType(SeedModel):
    code: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    name_ar: str = Field(min_length=1)
    name_en: str = Field(min_length=1)
    icon_key: str | None = None


class SeedSource(SeedModel):
    key: str = Field(pattern=r"^[a-z0-9][a-z0-9_-]*$")
    source_type: str = Field(min_length=1)
    title: str = Field(min_length=1)
    author: str | None = None
    edition: str | None = None
    publication_data: str | None = None
    url: HttpUrl | None = None
    notes: str | None = None


class SeedPerson(SeedModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    canonical_name_ar: str = Field(min_length=1)
    canonical_name_en: str | None = None
    aliases: str | None = None
    birth_date: SeedHistoricalDate | None = None
    death_date: SeedHistoricalDate | None = None
    biography_ar: str | None = None
    confidence_level: Confidence


class SeedPlace(SeedModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name_ar: str = Field(min_length=1)
    name_en: str | None = None
    place_type: str = Field(min_length=1)
    point: tuple[float, float] | None = None
    modern_reference: str | None = None

    @model_validator(mode="after")
    def validate_point(self) -> SeedPlace:
        if self.point is None:
            return self
        longitude, latitude = self.point
        if not -180 <= longitude <= 180:
            raise ValueError("longitude must be between -180 and 180")
        if not -90 <= latitude <= 90:
            raise ValueError("latitude must be between -90 and 90")
        if not self.modern_reference:
            raise ValueError("mapped places require an uncertainty or modern reference note")
        return self


class SeedState(SeedModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    name_ar: str = Field(min_length=1)
    name_en: str | None = None
    state_type: str = Field(min_length=1)
    start_date: SeedHistoricalDate | None = None
    end_date: SeedHistoricalDate | None = None
    relation_to_abbasid: str | None = None


class SeedPersonLink(SeedModel):
    person: str
    role_code: str = ""


class SeedPlaceLink(SeedModel):
    place: str
    relation_type: str


class SeedStateLink(SeedModel):
    state: str
    relation_type: str


class SeedSourceLink(SeedModel):
    source: str
    citation_locator: str | None = None
    support_type: str
    reliability_note: str | None = None


class SeedEvent(SeedModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    title_ar: str = Field(min_length=1)
    title_en: str | None = None
    event_type: str
    start_date: SeedHistoricalDate
    end_date: SeedHistoricalDate | None = None
    summary_ar: str = Field(min_length=1)
    summary_en: str | None = None
    causes_ar: str | None = None
    consequences_ar: str | None = None
    importance: int = Field(ge=1, le=5)
    confidence_level: Confidence
    publication_status: Publication
    primary_place: str | None = None
    geometry: tuple[float, float] | None = None
    editorial_notes: str | None = None
    people: list[SeedPersonLink] = Field(default_factory=list)
    places: list[SeedPlaceLink] = Field(default_factory=list)
    states: list[SeedStateLink] = Field(default_factory=list)
    sources: list[SeedSourceLink] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_geometry(self) -> SeedEvent:
        if self.geometry is None:
            return self
        longitude, latitude = self.geometry
        if not -180 <= longitude <= 180:
            raise ValueError("longitude must be between -180 and 180")
        if not -90 <= latitude <= 90:
            raise ValueError("latitude must be between -90 and 90")
        if not self.editorial_notes:
            raise ValueError("mapped events require an uncertainty or reference note")
        return self


class CorpusPackage(SeedModel):
    event_types: list[SeedEventType]
    sources: list[SeedSource]
    people: list[SeedPerson]
    places: list[SeedPlace]
    states: list[SeedState]
    events: list[SeedEvent]


class CorpusCounts(SeedModel):
    events: int
    people: int
    places: int
    states: int
    sources: int
    event_types: int


class CorpusManifest(SeedModel):
    counts: CorpusCounts
    events_by_year: dict[int, int]
    events_by_type: dict[str, int]
    non_spatial_events: list[str]
    approximate_or_disputed_events: list[str]
