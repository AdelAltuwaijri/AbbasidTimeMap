"""Response schemas for annual Hijri timeline state."""

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.map import EventFeatureCollection


class TimelineEventSummary(BaseModel):
    id: UUID
    slug: str
    title_ar: str
    event_type: str | None
    year_start_hijri: int
    year_end_hijri: int | None
    importance: int | None
    confidence: str | None


class BoundaryFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: UUID
    geometry: dict[str, Any]
    properties: dict[str, Any]


class BoundaryFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[BoundaryFeature] = Field(default_factory=list)


class TimelineMetadata(BaseModel):
    calendar: Literal["hijri"] = "hijri"
    granularity: Literal["year"] = "year"


class TimelineState(BaseModel):
    year_hijri: int
    metadata: TimelineMetadata = Field(default_factory=TimelineMetadata)
    events: list[TimelineEventSummary] = Field(default_factory=list)
    event_features: EventFeatureCollection = Field(default_factory=EventFeatureCollection)
    boundaries: BoundaryFeatureCollection = Field(default_factory=BoundaryFeatureCollection)
