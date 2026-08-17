"""Spatial queries and GeoJSON assembly for the public map API."""

from __future__ import annotations

import json
from numbers import Real
from typing import Any

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, aliased

from app.models.historical import (
    EventType,
    HistoricalCalendar,
    HistoricalDate,
    HistoricalEvent,
    Place,
    PublicationStatus,
)
from app.schemas.map import (
    EventFeature,
    EventFeatureCollection,
    EventFeatureProperties,
    PointGeometry,
)


def get_event_feature_collection(session: Session) -> EventFeatureCollection:
    """Return published geolocated events as point-marker GeoJSON.

    Event geometry takes precedence over the primary place point. Non-point event
    geometry is reduced to a stable point on its surface for marker rendering.
    Records without either geometry are omitted.
    """

    start_date = aliased(HistoricalDate)
    end_date = aliased(HistoricalDate)
    marker_geometry = func.ST_PointOnSurface(
        func.coalesce(HistoricalEvent.primary_geometry, Place.point)
    )

    statement = (
        select(
            HistoricalEvent.id,
            HistoricalEvent.slug,
            HistoricalEvent.title_ar,
            EventType.code.label("event_type"),
            start_date.year.label("year_start_hijri"),
            case(
                (end_date.calendar == HistoricalCalendar.HIJRI.value, end_date.year),
                else_=None,
            ).label("year_end_hijri"),
            HistoricalEvent.importance,
            HistoricalEvent.confidence_level.label("confidence"),
            func.ST_AsGeoJSON(marker_geometry).label("geometry_json"),
        )
        .join(start_date, HistoricalEvent.start_date_id == start_date.id)
        .outerjoin(end_date, HistoricalEvent.end_date_id == end_date.id)
        .outerjoin(EventType, HistoricalEvent.event_type_id == EventType.id)
        .outerjoin(Place, HistoricalEvent.primary_place_id == Place.id)
        .where(
            HistoricalEvent.publication_status == PublicationStatus.PUBLISHED.value,
            start_date.calendar == HistoricalCalendar.HIJRI.value,
        )
        .order_by(start_date.year, HistoricalEvent.slug)
    )

    features = [feature for row in session.execute(statement).all() if (feature := _row_to_feature(row))]
    return EventFeatureCollection(features=features)


def _row_to_feature(row: Any) -> EventFeature | None:
    geometry_json = row.geometry_json
    if not geometry_json:
        return None

    geometry = json.loads(geometry_json) if isinstance(geometry_json, str) else geometry_json
    coordinates = geometry.get("coordinates", [])
    if (
        geometry.get("type") != "Point"
        or len(coordinates) < 2
        or not all(isinstance(value, Real) for value in coordinates[:2])
        or not -180 <= coordinates[0] <= 180
        or not -90 <= coordinates[1] <= 90
    ):
        return None

    point = PointGeometry(coordinates=(coordinates[0], coordinates[1]))
    properties = EventFeatureProperties(
        id=row.id,
        slug=row.slug,
        title_ar=row.title_ar,
        event_type=row.event_type,
        year_start_hijri=row.year_start_hijri,
        year_end_hijri=row.year_end_hijri,
        importance=row.importance,
        confidence=row.confidence,
    )
    return EventFeature(id=row.id, geometry=point, properties=properties)
