"""Contract, SQL projection, and serialization tests for historical search."""

from types import SimpleNamespace
from uuid import uuid4

import pytest
from pydantic import ValidationError
from sqlalchemy.dialects import postgresql

from app.schemas.search import (
    SearchBounds,
    SearchCoordinates,
    SearchResponse,
    SearchResult,
)
from app.services.search import build_search_statement, search_historical_entities


def result_values(**overrides):
    event_id = uuid4()
    values = {
        "entity_type": "event",
        "id": event_id,
        "slug": "founding-of-baghdad",
        "title_ar": "تأسيس بغداد",
        "title_en": "Founding of Baghdad",
        "subtitle_ar": "حدث — تأسيس مدينة، 145هـ",
        "relevant_hijri_year": 145,
        "relevant_end_year": None,
        "coordinates": SearchCoordinates(longitude=44.3661, latitude=33.3152),
        "bounds": None,
        "confidence": "high",
        "navigation_event_id": event_id,
        "navigation_event_slug": "founding-of-baghdad",
    }
    values.update(overrides)
    return values


def test_search_result_accepts_named_point_or_ordered_bounds() -> None:
    point = SearchResult(**result_values())
    assert point.coordinates == SearchCoordinates(longitude=44.3661, latitude=33.3152)

    bounded = SearchResult(
        **result_values(
            entity_type="state",
            coordinates=None,
            bounds=SearchBounds(west=30, south=20, east=50, north=40),
            navigation_event_id=None,
            navigation_event_slug=None,
        )
    )
    assert bounded.bounds and bounded.bounds.west == 30


@pytest.mark.parametrize(
    "overrides",
    [
        {"bounds": SearchBounds(west=30, south=20, east=50, north=40)},
        {"navigation_event_slug": None},
        {"navigation_event_id": None},
        {"relevant_end_year": 144},
        {"navigation_event_id": uuid4()},
        {
            "entity_type": "person",
            "navigation_event_id": None,
            "navigation_event_slug": None,
        },
    ],
)
def test_search_result_rejects_spatial_or_navigation_invariant_violations(
    overrides: dict,
) -> None:
    with pytest.raises(ValidationError):
        SearchResult(**result_values(**overrides))


@pytest.mark.parametrize(
    "values",
    [
        {"west": 10, "south": 0, "east": 9, "north": 1},
        {"west": 10, "south": 2, "east": 11, "north": 1},
    ],
)
def test_search_bounds_reject_reversed_axes(values: dict) -> None:
    with pytest.raises(ValidationError):
        SearchBounds(**values)


def test_search_statement_is_one_globally_ranked_bound_union() -> None:
    statement = build_search_statement("أبو مسلم", limit=7)
    compiled = statement.compile(dialect=postgresql.dialect())
    sql = str(compiled)

    assert sql.count("UNION ALL") >= 3
    assert "publication_status" in sql
    assert "published" in compiled.params.values()
    assert "event_people" in sql
    assert "event_places" in sql
    assert "event_states" in sql
    assert "political_boundaries" in sql
    assert "row_number() OVER" in sql
    assert "ORDER BY" in sql
    assert "LIMIT" in sql
    assert "modern_reference" not in sql
    assert "biography" not in sql
    assert "summary_ar" not in sql
    assert "أبو مسلم" not in sql
    assert any(value == 7 for value in compiled.params.values())


def test_search_limit_counts_normalized_visible_characters() -> None:
    accepted = ("ب" * 100) + "َ"
    assert SearchResponse(query=accepted, results=[]).query == accepted
    assert build_search_statement(accepted, limit=1) is not None

    with pytest.raises(ValueError, match="2-100"):
        build_search_statement(("ب" * 101) + "َ", limit=1)


class _Mappings:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class _Result:
    def __init__(self, rows):
        self._rows = rows

    def mappings(self):
        return _Mappings(self._rows)


class _Session:
    def __init__(self, rows):
        self.rows = rows
        self.statement = None

    def execute(self, statement):
        self.statement = statement
        return _Result(self.rows)


def test_search_service_serializes_compact_named_spatial_values() -> None:
    event_id = uuid4()
    row = SimpleNamespace(
        entity_type="event",
        id=event_id,
        slug="founding-of-baghdad",
        title_ar="تأسيس بغداد",
        title_en="Founding of Baghdad",
        subtitle_ar="حدث — تأسيس مدينة، 145هـ",
        relevant_hijri_year=145,
        relevant_end_year=None,
        longitude=44.3661,
        latitude=33.3152,
        west=None,
        south=None,
        east=None,
        north=None,
        confidence="high",
        navigation_event_id=event_id,
        navigation_event_slug="founding-of-baghdad",
    )
    session = _Session([vars(row)])

    response = search_historical_entities(session, query="  بغداد  ", limit=10)

    assert response.query == "بغداد"
    assert len(response.results) == 1
    assert response.results[0].coordinates == SearchCoordinates(
        longitude=44.3661, latitude=33.3152
    )
    assert response.results[0].bounds is None
    assert session.statement is not None
