"""Annual Hijri timeline-state queries for public historical records."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.orm import Session, aliased

from app.models.historical import (
    EventType,
    HistoricalCalendar,
    HistoricalDate,
    HistoricalEvent,
    Place,
    PoliticalBoundary,
    PublicationStatus,
    State,
)
from app.schemas.map import (
    EventFeature,
    EventFeatureCollection,
    EventFeatureProperties,
    PointGeometry,
)
from app.schemas.timeline import (
    BoundaryFeature,
    BoundaryFeatureCollection,
    TimelineEventSummary,
    TimelineState,
)


def get_timeline_state(session: Session, year_hijri: int) -> TimelineState:
    """Return published events and political boundaries valid in one Hijri year."""

    event_rows = session.execute(_active_events_statement(year_hijri)).all()
    events = [_event_summary(row) for row in event_rows]
    features = [_event_feature(row) for row in event_rows]
    boundary_rows = session.execute(_boundaries_statement(year_hijri)).all()
    boundaries = [_boundary_feature(row) for row in boundary_rows]
    return TimelineState(
        year_hijri=year_hijri,
        events=events,
        event_features=EventFeatureCollection(features=[feature for feature in features if feature]),
        boundaries=BoundaryFeatureCollection(features=[feature for feature in boundaries if feature]),
    )


def _active_events_statement(year_hijri: int):
    start = aliased(HistoricalDate)
    end = aliased(HistoricalDate)
    marker = func.ST_PointOnSurface(func.coalesce(HistoricalEvent.primary_geometry, Place.point))
    return (
        select(
            HistoricalEvent.id, HistoricalEvent.slug, HistoricalEvent.title_ar,
            EventType.code.label("event_type"), start.year.label("year_start_hijri"),
            case((end.calendar == HistoricalCalendar.HIJRI.value, end.year), else_=None).label("year_end_hijri"),
            HistoricalEvent.importance, HistoricalEvent.confidence_level.label("confidence"),
            func.ST_AsGeoJSON(marker).label("geometry_json"),
        )
        .join(start, HistoricalEvent.start_date_id == start.id)
        .outerjoin(end, HistoricalEvent.end_date_id == end.id)
        .outerjoin(EventType, HistoricalEvent.event_type_id == EventType.id)
        .outerjoin(Place, HistoricalEvent.primary_place_id == Place.id)
        .where(
            HistoricalEvent.publication_status == PublicationStatus.PUBLISHED.value,
            start.calendar == HistoricalCalendar.HIJRI.value,
            start.year <= year_hijri,
            or_(
                and_(HistoricalEvent.end_date_id.is_(None), start.year == year_hijri),
                and_(
                    end.calendar == HistoricalCalendar.HIJRI.value,
                    end.year >= year_hijri,
                ),
            ),
        )
        .order_by(start.year, HistoricalEvent.slug)
    )


def _boundaries_statement(year_hijri: int):
    valid_from = aliased(HistoricalDate)
    valid_to = aliased(HistoricalDate)
    return (
        select(
            PoliticalBoundary.id, State.slug.label("state_slug"), State.name_ar.label("state_name_ar"),
            valid_from.year.label("valid_from_hijri"), valid_to.year.label("valid_to_hijri"),
            PoliticalBoundary.confidence_level.label("confidence"),
            func.ST_AsGeoJSON(PoliticalBoundary.geometry).label("geometry_json"),
        )
        .join(State, PoliticalBoundary.state_id == State.id)
        .join(valid_from, PoliticalBoundary.valid_from_date_id == valid_from.id)
        .outerjoin(valid_to, PoliticalBoundary.valid_to_date_id == valid_to.id)
        .where(
            valid_from.calendar == HistoricalCalendar.HIJRI.value,
            valid_from.year <= year_hijri,
            or_(PoliticalBoundary.valid_to_date_id.is_(None), and_(valid_to.calendar == HistoricalCalendar.HIJRI.value, valid_to.year >= year_hijri)),
        )
        .order_by(State.slug, valid_from.year)
    )


def _event_summary(row: Any) -> TimelineEventSummary:
    return TimelineEventSummary(
        id=row.id, slug=row.slug, title_ar=row.title_ar, event_type=row.event_type,
        year_start_hijri=row.year_start_hijri, year_end_hijri=row.year_end_hijri,
        importance=row.importance, confidence=row.confidence,
    )


def _event_feature(row: Any) -> EventFeature | None:
    geometry = _point_geometry(row.geometry_json)
    if geometry is None:
        return None
    return EventFeature(
        id=row.id, geometry=geometry,
        properties=EventFeatureProperties(**_event_summary(row).model_dump()),
    )


def _boundary_feature(row: Any) -> BoundaryFeature | None:
    if not row.geometry_json:
        return None
    geometry = json.loads(row.geometry_json) if isinstance(row.geometry_json, str) else row.geometry_json
    if geometry.get("type") not in {"Polygon", "MultiPolygon"}:
        return None
    return BoundaryFeature(
        id=row.id, geometry=geometry,
        properties={"state_slug": row.state_slug, "state_name_ar": row.state_name_ar,
                    "valid_from_hijri": row.valid_from_hijri, "valid_to_hijri": row.valid_to_hijri,
                    "confidence": row.confidence},
    )


def _point_geometry(value: Any) -> PointGeometry | None:
    if not value:
        return None
    geometry = json.loads(value) if isinstance(value, str) else value
    coordinates = geometry.get("coordinates", [])
    if geometry.get("type") != "Point" or len(coordinates) < 2:
        return None
    return PointGeometry(coordinates=(coordinates[0], coordinates[1]))
