"""API and service coverage for F-03 event-marker GeoJSON."""

from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.session import get_session
from app.main import app


class FakeResult:
    def __init__(self, rows: list[SimpleNamespace]) -> None:
        self.rows = rows

    def all(self) -> list[SimpleNamespace]:
        return self.rows


class FakeSession:
    def __init__(self, rows: list[SimpleNamespace]) -> None:
        self.rows = rows

    def execute(self, _statement: object) -> FakeResult:
        return FakeResult(self.rows)


def event_row(*, geometry_json: str | None) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        slug="fixture-event",
        title_ar="حدث اختباري غير منشور للمستخدم",
        event_type="political",
        year_start_hijri=145,
        year_end_hijri=None,
        importance=3,
        confidence="high",
        geometry_json=geometry_json,
    )


def request_with_rows(rows: list[SimpleNamespace]):
    app.dependency_overrides[get_session] = lambda: FakeSession(rows)
    try:
        return TestClient(app).get("/api/v1/map/events")
    finally:
        app.dependency_overrides.clear()


def test_map_events_returns_feature_collection_with_required_properties() -> None:
    response = request_with_rows([event_row(geometry_json='{"type":"Point","coordinates":[44.36,33.31]}')])

    assert response.status_code == 200
    payload = response.json()
    assert payload["type"] == "FeatureCollection"
    assert len(payload["features"]) == 1

    feature = payload["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"] == {"type": "Point", "coordinates": [44.36, 33.31]}
    assert set(feature["properties"]) == {
        "id",
        "slug",
        "title_ar",
        "entity_type",
        "event_type",
        "year_start_hijri",
        "year_end_hijri",
        "importance",
        "confidence",
    }


def test_event_without_geometry_does_not_break_collection() -> None:
    response = request_with_rows([event_row(geometry_json=None)])

    assert response.status_code == 200
    assert response.json() == {"type": "FeatureCollection", "features": []}
