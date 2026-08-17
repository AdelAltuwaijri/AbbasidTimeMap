"""Unit and schema tests for F-02's curated historical data model."""

from __future__ import annotations

from uuid import uuid4

import pytest
from geoalchemy2 import Geometry
from pydantic import ValidationError

from app.db.base import Base
from app.models.historical import (
    WGS84_SRID,
    DatePrecision,
    HistoricalCalendar,
    HistoricalDate,
    HistoricalEvent,
    Person,
    Place,
    PublicationStatus,
    Source,
    State,
)
from app.schemas.historical import HistoricalDateCreate, HistoricalEventCreate
from app.services.publication import (
    PublicationValidationError,
    publish_event,
    validate_event_date_range,
)


def test_event_can_link_people_places_states_and_sources() -> None:
    event = HistoricalEvent(slug="draft-event", title_ar="حدث تجريبي", start_date_id=uuid4())
    event.people.append(Person(slug="person", canonical_name_ar="شخص"))
    event.places.append(Place(slug="place", name_ar="مكان", place_type="city"))
    event.states.append(State(slug="state", name_ar="دولة", state_type="caliphate"))
    event.sources.append(Source(source_type="academic", title="Test reference"))

    assert len(event.people) == len(event.places) == len(event.states) == len(event.sources) == 1


def test_published_event_without_source_is_rejected() -> None:
    with pytest.raises(ValidationError, match="supporting source"):
        HistoricalEventCreate(
            slug="unsourced", title_ar="حدث", start_date_id=uuid4(),
            publication_status=PublicationStatus.PUBLISHED,
        )

    event = HistoricalEvent(slug="unsourced", title_ar="حدث", start_date_id=uuid4())
    with pytest.raises(PublicationValidationError):
        publish_event(event)


def test_published_event_with_source_is_allowed() -> None:
    payload = HistoricalEventCreate(
        slug="sourced", title_ar="حدث", start_date_id=uuid4(),
        publication_status=PublicationStatus.PUBLISHED, source_ids=[uuid4()],
    )
    assert payload.source_ids


def test_approximate_hijri_date_preserves_precision_and_display_label() -> None:
    date = HistoricalDateCreate(
        calendar=HistoricalCalendar.HIJRI, year=145, precision=DatePrecision.APPROXIMATE,
        circa=True, display_label_ar="نحو 145 هـ",
    )
    assert date.year == 145
    assert date.precision is DatePrecision.APPROXIMATE
    assert date.display_label_ar == "نحو 145 هـ"


def test_historical_event_can_represent_a_date_range() -> None:
    event = HistoricalEventCreate(
        slug="range", title_ar="نطاق تاريخي", start_date_id=uuid4(), end_date_id=uuid4(),
    )
    assert event.end_date_id is not None


def test_historical_event_rejects_a_backwards_comparable_range() -> None:
    start = HistoricalDate(calendar="hijri", year=145, precision="year")
    end = HistoricalDate(calendar="hijri", year=144, precision="year")
    event = HistoricalEvent(
        slug="invalid-range",
        title_ar="نطاق غير صالح",
        start_date_id=uuid4(),
        end_date_id=uuid4(),
        start_date=start,
        end_date=end,
    )
    with pytest.raises(PublicationValidationError, match="end year"):
        validate_event_date_range(event)


def test_spatial_columns_use_wgs84_and_required_gist_indexes_exist() -> None:
    assert WGS84_SRID == 4326
    assert isinstance(Place.__table__.c.point.type, Geometry)
    assert Place.__table__.c.point.type.srid == WGS84_SRID
    assert isinstance(HistoricalEvent.__table__.c.primary_geometry.type, Geometry)
    assert HistoricalEvent.__table__.c.primary_geometry.type.srid == WGS84_SRID

    migration = (
        __import__("pathlib").Path(__file__).parents[1]
        / "alembic/versions/c833db6623d1_create_historical_data_model.py"
    ).read_text(encoding="utf-8")
    for index_name in (
        "ix_places_point_gist", "ix_places_area_gist",
        "ix_historical_events_primary_geometry_gist", "ix_political_boundaries_geometry_gist",
    ):
        assert index_name in migration
    assert 'postgresql_using="gist"' in migration


def test_historical_date_table_has_documented_constraints() -> None:
    constraints = {constraint.name for constraint in HistoricalDate.__table__.constraints}
    assert {"ck_dates_calendar", "ck_dates_precision", "ck_dates_month", "ck_dates_day"} <= constraints
    assert "historical_events" in Base.metadata.tables
