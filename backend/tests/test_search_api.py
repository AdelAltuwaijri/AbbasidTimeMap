"""HTTP contract and validation tests for the public historical search route."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

import app.api.v1.search as search_api
from app.db.session import get_session
from app.main import app
from app.schemas.search import SearchResponse, SearchResult


class _Session:
    pass


@pytest.fixture
def client():
    app.dependency_overrides[get_session] = lambda: _Session()
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def test_search_endpoint_returns_compact_results_and_forwards_default_limit(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    event_id = uuid4()
    captured = {}

    def fake_search(session, *, query, limit):
        captured.update(session=session, query=query, limit=limit)
        return SearchResponse(
            query=query,
            results=[
                SearchResult(
                    entity_type="event",
                    id=event_id,
                    slug="founding-of-baghdad",
                    title_ar="تأسيس بغداد",
                    title_en="Founding of Baghdad",
                    subtitle_ar="حدث — تأسيس مدينة، 145هـ",
                    relevant_hijri_year=145,
                    confidence="high",
                    navigation_event_id=event_id,
                    navigation_event_slug="founding-of-baghdad",
                )
            ],
        )

    monkeypatch.setattr(search_api, "search_historical_entities", fake_search)

    response = client.get("/api/v1/search", params={"q": "  بغداد  "})

    assert response.status_code == 200
    assert captured["query"] == "بغداد"
    assert captured["limit"] == 10
    body = response.json()
    assert body["query"] == "بغداد"
    assert body["results"][0]["entity_type"] == "event"
    assert "summary_ar" not in body["results"][0]
    assert "sources" not in body["results"][0]


def test_search_endpoint_returns_empty_result_as_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        search_api,
        "search_historical_entities",
        lambda _session, *, query, limit: SearchResponse(query=query, results=[]),
    )

    response = client.get(
        "/api/v1/search", params={"q": "اسم غير موجود", "limit": 20}
    )

    assert response.status_code == 200
    assert response.json() == {"query": "اسم غير موجود", "results": []}


def test_search_endpoint_counts_normalized_visible_characters_for_maximum(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    query = ("ب" * 100) + "َ"
    captured = {}

    def fake_search(_session, *, query, limit):
        captured.update(query=query, limit=limit)
        return SearchResponse(query=query, results=[])

    monkeypatch.setattr(search_api, "search_historical_entities", fake_search)

    response = client.get("/api/v1/search", params={"q": query})

    assert response.status_code == 200
    assert captured == {"query": query, "limit": 10}
    assert response.json() == {"query": query, "results": []}


@pytest.mark.parametrize(
    "params",
    [
        {},
        {"q": ""},
        {"q": " "},
        {"q": "ا"},
        {"q": "ـَـ"},
        {"q": "\u200b\u200b"},
        {"q": "\u200f\u2067"},
        {"q": "\u034f\u034f"},
        {"q": "\ufe0f\ufe0f"},
        {"q": "س" * 101},
        {"q": ("س" * 101) + "َ"},
        {"q": "بغداد", "limit": 0},
        {"q": "بغداد", "limit": 21},
        {"q": "بغداد", "limit": "many"},
    ],
)
def test_search_endpoint_rejects_invalid_query_or_limit(
    client: TestClient, params: dict
) -> None:
    response = client.get("/api/v1/search", params=params)
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


def test_search_endpoint_does_not_hide_service_failures(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    app.dependency_overrides[get_session] = lambda: _Session()

    def fail(*_args, **_kwargs):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(search_api, "search_historical_entities", fail)
    try:
        response = TestClient(app, raise_server_exceptions=False).get(
            "/api/v1/search", params={"q": "بغداد"}
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
