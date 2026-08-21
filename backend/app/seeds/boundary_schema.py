"""Strict schemas for reviewed M-02 historical boundary packages."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from shapely.geometry import shape
from shapely.validation import explain_validity

from app.seeds.corpus_schema import SeedHistoricalDate, SeedSource, SeedSourceLink

BoundaryConfidence = Literal["high", "medium", "approximate", "disputed"]
SpatialPrecision = Literal["exact", "approximate", "disputed"]
BoundaryPublication = Literal["draft", "reviewed", "published", "archived"]


class BoundarySeedModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class BoundaryProperties(BoundarySeedModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    state_slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    valid_from: SeedHistoricalDate
    valid_to: SeedHistoricalDate
    confidence_level: BoundaryConfidence
    spatial_precision: SpatialPrecision
    publication_status: BoundaryPublication
    srid: Literal[4326] = 4326
    reconstruction_notes_ar: str = Field(min_length=1)
    methodology_notes_ar: str = Field(min_length=1)
    limitations_notes_ar: str = Field(min_length=1)
    overlap_justification: str | None = None
    anchors: list[str] = Field(min_length=1)
    exclusions: list[str] = Field(min_length=1)
    sources: list[SeedSourceLink] = Field(default_factory=list)


class BoundaryGeometry(BoundarySeedModel):
    type: Literal["MultiPolygon"]
    coordinates: list[Any]

    @model_validator(mode="after")
    def validate_geometry(self) -> BoundaryGeometry:
        try:
            geometry = shape(self.model_dump())
        except Exception as error:
            raise ValueError(f"invalid MultiPolygon coordinates: {error}") from error
        if geometry.is_empty:
            raise ValueError("boundary geometry cannot be empty")
        if geometry.geom_type != "MultiPolygon":
            raise ValueError("boundary geometry must be a MultiPolygon")
        if not geometry.is_valid:
            raise ValueError(f"boundary geometry must be valid: {explain_validity(geometry)}")
        minimum_x, minimum_y, maximum_x, maximum_y = geometry.bounds
        if minimum_x < -180 or maximum_x > 180 or minimum_y < -90 or maximum_y > 90:
            raise ValueError("boundary geometry coordinates must remain inside WGS84 bounds")
        return self

    def vertex_count(self) -> int:
        return sum(
            len(ring)
            for polygon in self.coordinates
            for ring in polygon
        )


class BoundaryFeature(BoundarySeedModel):
    type: Literal["Feature"]
    geometry: BoundaryGeometry
    properties: BoundaryProperties


class BoundaryFeatureCollection(BoundarySeedModel):
    type: Literal["FeatureCollection"]
    name: str | None = None
    features: list[BoundaryFeature] = Field(min_length=1)


class BoundaryPackage(BoundarySeedModel):
    sources: list[SeedSource]
    boundaries: BoundaryFeatureCollection


class BoundaryCounts(BoundarySeedModel):
    boundaries: int
    sources: int
    states: int


class BoundaryPeriod(BoundarySeedModel):
    slug: str
    state_slug: str
    valid_from_hijri: int
    valid_to_hijri: int


class BoundaryManifest(BoundarySeedModel):
    counts: BoundaryCounts
    periods: list[BoundaryPeriod]
    by_confidence: dict[str, int]
    by_spatial_precision: dict[str, int]
    total_vertices: int
