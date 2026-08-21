from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.dialects import postgresql

from app.db.session import get_session
from app.main import app
from app.services.timeline import _active_events_statement, _boundaries_statement


class Result:
    def __init__(self, rows): self.rows = rows
    def all(self): return self.rows


class Session:
    def __init__(self, results): self.results = iter(results)
    def execute(self, _statement): return Result(next(self.results))


def event(*, start=145, end=None, geometry='{"type":"Point","coordinates":[44.36,33.31]}'):
    return SimpleNamespace(id=uuid4(), slug="event", title_ar="حدث اختباري", event_type="political", year_start_hijri=start, year_end_hijri=end, importance=3, confidence="disputed", geometry_json=geometry)


def boundary(*, start=140, end=150):
    return SimpleNamespace(
        id=uuid4(), boundary_slug="state-extent-140-150", state_id=uuid4(),
        state_slug="state", state_name_ar="دولة اختبار", valid_from_hijri=start,
        valid_to_hijri=end, confidence="medium", spatial_precision="approximate",
        source_count=2, primary_source_title="مرجع أكاديمي",
        primary_source_url="https://example.test/reference",
        reconstruction_note_ar="إعادة بناء تقريبية وليست حدًا دوليًا دقيقًا.",
        geometry_json='{"type":"MultiPolygon","coordinates":[[[[30,20],[31,20],[31,21],[30,21],[30,20]]]]}',
    )


def request(event_rows, boundary_rows, year=145):
    app.dependency_overrides[get_session] = lambda: Session([event_rows, boundary_rows])
    try:
        return TestClient(app).get(f"/api/v1/timeline/state?year_hijri={year}")
    finally:
        app.dependency_overrides.clear()


def test_timeline_state_returns_same_year_event_and_valid_boundary():
    response = request([event()], [boundary()])
    assert response.status_code == 200
    payload = response.json()
    assert payload["year_hijri"] == 145
    assert len(payload["events"]) == 1
    assert len(payload["event_features"]["features"]) == 1
    assert len(payload["boundaries"]["features"]) == 1
    properties = payload["boundaries"]["features"][0]["properties"]
    assert properties["boundary_slug"] == "state-extent-140-150"
    assert properties["state_slug"] == "state"
    assert properties["confidence"] == "medium"
    assert properties["spatial_precision"] == "approximate"
    assert properties["source_count"] == 2
    assert properties["primary_source_title"] == "مرجع أكاديمي"


def test_timeline_state_keeps_range_event_and_omits_event_without_geometry():
    response = request([event(start=140, end=150, geometry=None)], [])
    assert response.status_code == 200
    assert len(response.json()["events"]) == 1
    assert response.json()["event_features"]["features"] == []


def test_timeline_state_returns_clean_empty_state():
    response = request([], [])
    assert response.status_code == 200
    assert response.json()["events"] == []
    assert response.json()["boundaries"]["features"] == []


def test_timeline_rejects_invalid_year():
    app.dependency_overrides[get_session] = lambda: Session([[], []])
    try:
        assert TestClient(app).get("/api/v1/timeline/state?year_hijri=0").status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_year_only_event_is_not_treated_as_open_ended():
    sql = str(
        _active_events_statement(146).compile(
            dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}
        )
    )
    assert "historical_events.end_date_id IS NULL" in sql
    assert "historical_dates_1.year = 146" in sql


def test_boundary_query_is_inclusive_and_published_only():
    sql = str(
        _boundaries_statement(144).compile(
            dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}
        )
    )
    assert "political_boundaries.publication_status = 'published'" in sql
    assert "historical_dates_1.year <= 144" in sql
    assert "historical_dates_2.year >= 144" in sql
    assert "boundary_sources" in sql
