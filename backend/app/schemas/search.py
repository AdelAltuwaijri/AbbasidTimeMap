"""Strict compact API contract for M-03 historical search."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

SearchEntityType = Literal["event", "person", "place", "state"]


class SearchCoordinates(BaseModel):
    model_config = ConfigDict(extra="forbid")

    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)


class SearchBounds(BaseModel):
    model_config = ConfigDict(extra="forbid")

    west: float = Field(ge=-180, le=180)
    south: float = Field(ge=-90, le=90)
    east: float = Field(ge=-180, le=180)
    north: float = Field(ge=-90, le=90)

    @model_validator(mode="after")
    def ordered_axes(self) -> SearchBounds:
        if self.west > self.east:
            raise ValueError("west must be less than or equal to east")
        if self.south > self.north:
            raise ValueError("south must be less than or equal to north")
        return self


class SearchResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entity_type: SearchEntityType
    id: UUID
    slug: str
    title_ar: str
    title_en: str | None = None
    subtitle_ar: str
    relevant_hijri_year: int = Field(ge=1)
    relevant_end_year: int | None = Field(default=None, ge=1)
    coordinates: SearchCoordinates | None = None
    bounds: SearchBounds | None = None
    confidence: str | None = None
    navigation_event_id: UUID | None = None
    navigation_event_slug: str | None = None

    @model_validator(mode="after")
    def compact_projection_invariants(self) -> SearchResult:
        if self.coordinates is not None and self.bounds is not None:
            raise ValueError("coordinates and bounds are mutually exclusive")
        if (
            self.relevant_end_year is not None
            and self.relevant_end_year < self.relevant_hijri_year
        ):
            raise ValueError("relevant end year must not precede the start year")
        if (self.navigation_event_id is None) != (
            self.navigation_event_slug is None
        ):
            raise ValueError("navigation event id and slug must be paired")
        if self.entity_type in {"event", "person"} and self.navigation_event_id is None:
            raise ValueError("event and person results require a navigation event")
        if self.entity_type == "event" and (
            self.navigation_event_id != self.id
            or self.navigation_event_slug != self.slug
        ):
            raise ValueError("event results must navigate to themselves")
        return self


class SearchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str
    results: list[SearchResult] = Field(default_factory=list)
