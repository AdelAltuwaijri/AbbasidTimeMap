import os

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.models.historical import (
    EventPerson,
    EventPlace,
    EventSource,
    EventState,
    EventType,
    HistoricalDate,
    HistoricalEvent,
    Person,
    Place,
    PoliticalBoundary,
    Source,
    State,
)
from app.seeds.corpus_importer import import_corpus
from app.seeds.corpus_loader import CorpusValidationError, load_corpus

DATABASE_URL = os.getenv("M01_INTEGRATION_DATABASE_URL")


def counts(session: Session) -> dict[str, int]:
    models = {
        "events": HistoricalEvent,
        "dates": HistoricalDate,
        "event_types": EventType,
        "people": Person,
        "places": Place,
        "states": State,
        "sources": Source,
        "event_people": EventPerson,
        "event_places": EventPlace,
        "event_states": EventState,
        "event_sources": EventSource,
        "boundaries": PoliticalBoundary,
    }
    return {
        name: session.scalar(select(func.count()).select_from(model)) or 0
        for name, model in models.items()
    }


@pytest.mark.skipif(not DATABASE_URL, reason="requires M01_INTEGRATION_DATABASE_URL")
def test_import_is_idempotent_reuses_f05_and_never_adds_boundaries():
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    corpus = load_corpus()

    with Session(engine) as session:
        boundaries_before = counts(session)["boundaries"]
        first = import_corpus(session, corpus)
        baghdad_id = session.scalar(
            select(HistoricalEvent.id).where(HistoricalEvent.slug == "founding-of-baghdad")
        )
        first_counts = counts(session)
        second = import_corpus(session, corpus)
        second_counts = counts(session)
        second_baghdad_id = session.scalar(
            select(HistoricalEvent.id).where(HistoricalEvent.slug == "founding-of-baghdad")
        )

    assert first == second
    assert first_counts == second_counts
    assert baghdad_id == second_baghdad_id
    assert second_counts["boundaries"] == boundaries_before
    assert second_counts["events"] >= 42


@pytest.mark.skipif(not DATABASE_URL, reason="requires M01_INTEGRATION_DATABASE_URL")
def test_invalid_package_is_rejected_before_database_changes():
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    corpus = load_corpus().model_copy(deep=True)
    corpus.events[0] = corpus.events[0].model_copy(update={"sources": []})

    with Session(engine) as session:
        before = counts(session)
        with pytest.raises(CorpusValidationError, match="source"):
            import_corpus(session, corpus)
        after = counts(session)

    assert before == after
