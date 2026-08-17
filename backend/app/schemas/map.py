"""GeoJSON response schemas used by the map API."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class PointGeometry(BaseModel):
    """A WGS84 GeoJSON point."""

    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float]


class EventFeatureProperties(BaseModel):
    """Minimum documented properties for an event marker."""

    id: UUID
    slug: str
    title_ar: str
    entity_type: Literal["event"] = "event"
    event_type: str | None
    year_start_hijri: int
    year_end_hijri: int | None
    importance: int | None
    confidence: str | None


class EventFeature(BaseModel):
    """A GeoJSON feature representing one historical event marker."""

    type: Literal["Feature"] = "Feature"
    id: UUID
    geometry: PointGeometry
    properties: EventFeatureProperties


class EventFeatureCollection(BaseModel):
    """GeoJSON collection returned to the map client."""

    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[EventFeature]
