"""Live PostgreSQL acceptance coverage for the public M-04 event detail gate."""

from __future__ import annotations

import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.main import app
from app.models.historical import (
    EventPerson,
    EventPlace,
    EventSource,
    EventState,
    HistoricalDate,
    HistoricalEvent,
    Person,
    Place,
    PublicationStatus,
    Source,
    State,
)

DATABASE_URL = os.getenv("M04_INTEGRATION_DATABASE_URL")
pytestmark = pytest.mark.skipif(
    not DATABASE_URL, reason="requires M04_INTEGRATION_DATABASE_URL"
)


@pytest.fixture(scope="module")
def engine():
    value = create_engine(DATABASE_URL, pool_pre_ping=True)
    try:
        yield value
    finally:
        value.dispose()


def test_live_public_gate_hides_nonpublic_unsourced_and_unclassified_events(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    suffix = uuid4().hex
    try:
        date = HistoricalDate(
            calendar="hijri",
            year=145,
            precision="year",
            display_label_ar="145هـ",
            display_label_en="762 CE",
        )
        source = Source(
            source_type="modern_academic_monograph",
            title=f"M-04 integration source {suffix}",
        )
        person = Person(
            slug=f"m04-person-{suffix}", canonical_name_ar="شخصية متعددة الأدوار"
        )
        place = Place(
            slug=f"m04-place-{suffix}",
            name_ar="مكان متعدد العلاقات",
            place_type="region",
        )
        state = State(
            slug=f"m04-state-{suffix}",
            name_ar="كيان متعدد العلاقات",
            state_type="political_movement",
        )
        session.add_all([date, source, person, place, state])
        session.flush()

        valid = HistoricalEvent(
            slug=f"m04-valid-{suffix}",
            title_ar="حدث منشور موثق",
            start_date_id=date.id,
            confidence_level="high",
            publication_status=PublicationStatus.PUBLISHED.value,
        )
        unclassified = HistoricalEvent(
            slug=f"m04-unclassified-{suffix}",
            title_ar="حدث بلا تصنيف ثقة",
            start_date_id=date.id,
            confidence_level=None,
            publication_status=PublicationStatus.PUBLISHED.value,
        )
        blank_confidence = HistoricalEvent(
            slug=f"m04-blank-confidence-{suffix}",
            title_ar="حدث بتصنيف ثقة فارغ",
            start_date_id=date.id,
            confidence_level="",
            publication_status=PublicationStatus.PUBLISHED.value,
        )
        bogus_confidence = HistoricalEvent(
            slug=f"m04-bogus-confidence-{suffix}",
            title_ar="حدث بتصنيف ثقة غير صالح",
            start_date_id=date.id,
            confidence_level="bogus",
            publication_status=PublicationStatus.PUBLISHED.value,
        )
        unsourced = HistoricalEvent(
            slug=f"m04-unsourced-{suffix}",
            title_ar="حدث بلا مصدر",
            start_date_id=date.id,
            confidence_level="high",
            publication_status=PublicationStatus.PUBLISHED.value,
        )
        nonpublic = [
            HistoricalEvent(
                slug=f"m04-{status}-{suffix}",
                title_ar=f"حدث {status}",
                start_date_id=date.id,
                confidence_level="high",
                publication_status=status,
            )
            for status in (
                PublicationStatus.DRAFT.value,
                PublicationStatus.REVIEWED.value,
                PublicationStatus.ARCHIVED.value,
            )
        ]
        session.add_all(
            [
                valid,
                unclassified,
                blank_confidence,
                bogus_confidence,
                unsourced,
                *nonpublic,
            ]
        )
        session.flush()
        session.add_all(
            [
                EventSource(
                    event_id=valid.id,
                    source_id=source.id,
                    support_type="direct",
                ),
                EventSource(
                    event_id=unclassified.id,
                    source_id=source.id,
                    support_type="direct",
                ),
                EventSource(
                    event_id=blank_confidence.id,
                    source_id=source.id,
                    support_type="direct",
                ),
                EventSource(
                    event_id=bogus_confidence.id,
                    source_id=source.id,
                    support_type="direct",
                ),
                EventPerson(
                    event_id=valid.id,
                    person_id=person.id,
                    role_code="commander",
                ),
                EventPerson(
                    event_id=valid.id,
                    person_id=person.id,
                    role_code="patron",
                ),
                EventPlace(
                    event_id=valid.id,
                    place_id=place.id,
                    relation_type="battle_region",
                ),
                EventPlace(
                    event_id=valid.id,
                    place_id=place.id,
                    relation_type="route_context",
                ),
                EventState(
                    event_id=valid.id,
                    state_id=state.id,
                    relation_type="claimant",
                ),
                EventState(
                    event_id=valid.id,
                    state_id=state.id,
                    relation_type="participant",
                ),
                *[
                    EventSource(
                        event_id=event.id,
                        source_id=source.id,
                        support_type="direct",
                    )
                    for event in nonpublic
                ],
            ]
        )
        session.flush()

        def session_override():
            yield session

        app.dependency_overrides[get_session] = session_override
        client = TestClient(app)

        valid_response = client.get(f"/api/v1/events/{valid.slug}")
        hidden_responses = [
            client.get(f"/api/v1/events/{event.slug}")
            for event in [
                unclassified,
                blank_confidence,
                bogus_confidence,
                unsourced,
                *nonpublic,
            ]
        ]
        unknown_response = client.get(f"/api/v1/events/m04-unknown-{suffix}")

        assert valid_response.status_code == 200
        assert valid_response.json()["confidence"] == "high"
        assert valid_response.json()["sources"][0]["support_type"] == "direct"
        assert [
            item["role_code"] for item in valid_response.json()["related_people"]
        ] == ["commander", "patron"]
        assert [
            item["relation_type"] for item in valid_response.json()["related_places"]
        ] == ["battle_region", "route_context"]
        assert [
            item["relation_type"] for item in valid_response.json()["related_states"]
        ] == ["claimant", "participant"]
        assert all(response.status_code == 404 for response in hidden_responses)
        assert unknown_response.status_code == 404
    finally:
        app.dependency_overrides.clear()
        session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()
