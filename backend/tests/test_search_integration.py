"""Live PostgreSQL/PostGIS acceptance coverage for M-03 search."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, literal, select
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.main import app
from app.models.historical import (
    EventPerson,
    EventPlace,
    EventState,
    HistoricalDate,
    HistoricalEvent,
    Person,
    Place,
    PublicationStatus,
    State,
)
from app.services.search import search_historical_entities
from app.services.search_normalization import normalize_search_expression

DATABASE_URL = os.getenv("M03_INTEGRATION_DATABASE_URL")
pytestmark = pytest.mark.skipif(
    not DATABASE_URL, reason="requires M03_INTEGRATION_DATABASE_URL"
)


@pytest.fixture(scope="module")
def engine():
    value = create_engine(DATABASE_URL, pool_pre_ping=True)
    try:
        yield value
    finally:
        value.dispose()


def _search(engine, query: str, limit: int = 10):
    with Session(engine) as session:
        return search_historical_entities(session, query=query, limit=limit).results


def test_live_http_route_uses_the_bounded_postgres_search(engine) -> None:
    def session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = session_override
    try:
        client = TestClient(app)
        response = client.get(
            "/api/v1/search", params={"q": "بغداد", "limit": 2}
        )
        normalized_limit_response = client.get(
            "/api/v1/search", params={"q": ("ب" * 100) + "َ"}
        )
        over_limit_response = client.get(
            "/api/v1/search", params={"q": ("ب" * 101) + "َ"}
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["query"] == "بغداد"
    assert len(response.json()["results"]) == 2
    assert response.json()["results"][0]["slug"] == "baghdad"
    assert normalized_limit_response.status_code == 200
    assert normalized_limit_response.json()["results"] == []
    assert over_limit_response.status_code == 422


def test_live_postgres_normalizes_nfkc_arabic_and_whitespace(engine) -> None:
    with Session(engine) as session:
        normalized = session.scalar(
            select(normalize_search_expression(literal("\u200b  \ufefbـ  \u200f")))
        )
        latin = session.scalar(
            select(normalize_search_expression(literal("Straße")))
        )
    assert normalized == "لا"
    assert latin == "straße"

    canonical = _search(engine, "أبو مسلم")
    variant = _search(engine, "  اَبُو   مُسْلِم  ")
    assert [(item.entity_type, item.slug) for item in variant] == [
        (item.entity_type, item.slug) for item in canonical
    ]


def test_live_search_returns_each_public_entity_type_with_stable_context(engine) -> None:
    baghdad = _search(engine, "بغداد")
    assert baghdad[0].entity_type == "place"
    assert baghdad[0].slug == "baghdad"
    assert baghdad[0].relevant_hijri_year == 145
    assert baghdad[0].coordinates is not None
    assert baghdad[0].coordinates.longitude == pytest.approx(44.3661, abs=0.05)
    assert baghdad[0].coordinates.latitude == pytest.approx(33.3152, abs=0.05)
    assert baghdad[0].navigation_event_slug == "founding-of-baghdad"
    assert len({(item.entity_type, item.id) for item in baghdad}) == len(baghdad)

    abu_muslim = _search(engine, "أبو مسلم")
    assert abu_muslim[0].entity_type == "person"
    assert abu_muslim[0].slug == "abu-muslim"
    assert abu_muslim[0].navigation_event_slug == "killing-of-abu-muslim"
    assert abu_muslim[0].relevant_hijri_year == 137

    event = _search(engine, "معركة الزاب الكبير")
    assert event[0].entity_type == "event"
    assert event[0].slug == "battle-of-the-great-zab"
    assert event[0].navigation_event_id == event[0].id
    assert event[0].navigation_event_slug == event[0].slug

    state = _search(engine, "الخلافة العباسية")[0]
    assert state.entity_type == "state"
    assert state.slug == "abbasid-caliphate"
    assert state.relevant_hijri_year == 132
    assert state.bounds is not None
    assert state.coordinates is None
    assert state.navigation_event_id is None
    assert state.navigation_event_slug is None
    assert state.confidence == "medium"

    fallback_state = _search(engine, "الخلافة الأموية")[0]
    assert fallback_state.entity_type == "state"
    assert fallback_state.slug == "umayyad-caliphate"
    assert fallback_state.relevant_hijri_year == 132
    assert fallback_state.coordinates is None
    assert fallback_state.bounds is None
    assert fallback_state.navigation_event_slug == "abbasid-capture-of-damascus"
    assert fallback_state.confidence is None


def test_live_alias_ambiguity_ranking_and_global_limit_are_deterministic(engine) -> None:
    aliases = _search(engine, "عبد الله بن محمد")
    assert {(item.entity_type, item.slug) for item in aliases} == {
        ("person", "al-mansur"),
        ("person", "al-saffah"),
    }
    assert all(item.navigation_event_id for item in aliases)

    ranked = _search(engine, "المنصور")
    assert ranked[0].entity_type == "person"
    assert ranked[0].slug == "al-mansur"

    prefix = _search(engine, "بغ")
    assert prefix[0].entity_type == "place"
    assert prefix[0].slug == "baghdad"

    first = _search(engine, "ال", limit=3)
    second = _search(engine, "ال", limit=3)
    assert len(first) == 3
    assert [(item.entity_type, item.slug) for item in first] == [
        (item.entity_type, item.slug) for item in second
    ]
    assert _search(engine, "اسم تاريخي غير موجود") == []
    assert _search(engine, "%_") == []


def test_live_match_tiers_follow_the_documented_global_order(engine) -> None:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    try:
        context_event_id = session.scalar(
            select(HistoricalEvent.id).where(
                HistoricalEvent.slug == "founding-of-baghdad"
            )
        )
        assert context_event_id is not None
        people = [
            Person(slug="m03-tier-literal", canonical_name_ar="اسم اختبار"),
            Person(slug="m03-tier-normalized", canonical_name_ar="إسم اختبار"),
            Person(slug="m03-tier-prefix", canonical_name_ar="اسم اختبار موسع"),
            Person(
                slug="m03-tier-alias-exact",
                canonical_name_ar="شخصية أولى",
                aliases="اسم اختبار",
            ),
            Person(
                slug="m03-tier-alias-prefix",
                canonical_name_ar="شخصية ثانية",
                aliases="اسم اختبار مطول",
            ),
            Person(
                slug="m03-tier-partial",
                canonical_name_ar="لقب اسم اختبار تاريخي",
            ),
            Person(
                slug="m03-tier-alias-partial",
                canonical_name_ar="شخصية ثالثة",
                aliases="لقب اسم اختبار إضافي",
            ),
        ]
        session.add_all(people)
        session.flush()
        session.add_all(
            EventPerson(
                event_id=context_event_id,
                person_id=person.id,
                role_code="m03-test-context",
            )
            for person in people
        )
        session.flush()

        results = search_historical_entities(
            session, query="اسم اختبار", limit=20
        ).results
        tier_slugs = [item.slug for item in results if item.slug.startswith("m03-tier-")]
        assert tier_slugs == [
            "m03-tier-literal",
            "m03-tier-normalized",
            "m03-tier-prefix",
            "m03-tier-alias-exact",
            "m03-tier-alias-prefix",
            "m03-tier-partial",
            "m03-tier-alias-partial",
        ]
    finally:
        session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()


def test_live_search_excludes_draft_only_and_orphan_entities(engine) -> None:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    try:
        date = HistoricalDate(calendar="hijri", year=145, precision="year")
        person = Person(
            slug="m03-private-person",
            canonical_name_ar="كيان اختبار داخلي",
        )
        place = Place(
            slug="m03-private-place",
            name_ar="كيان اختبار داخلي",
            place_type="city",
        )
        state = State(
            slug="m03-private-state",
            name_ar="كيان اختبار داخلي",
            state_type="caliphate",
        )
        session.add_all([date, person, place, state])
        session.flush()
        event = HistoricalEvent(
            slug="m03-private-event",
            title_ar="كيان اختبار داخلي",
            start_date_id=date.id,
            primary_place_id=place.id,
            publication_status=PublicationStatus.DRAFT.value,
        )
        session.add(event)
        session.flush()
        session.add_all(
            [
                EventPerson(event_id=event.id, person_id=person.id, role_code=""),
                EventPlace(
                    event_id=event.id,
                    place_id=place.id,
                    relation_type="location",
                ),
                EventState(
                    event_id=event.id,
                    state_id=state.id,
                    relation_type="participant",
                ),
            ]
        )
        session.flush()

        response = search_historical_entities(
            session, query="كيان اختبار داخلي", limit=20
        )
        assert response.results == []
    finally:
        session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()
