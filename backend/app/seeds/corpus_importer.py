"""Atomic, canonical, idempotent persistence for validated seed corpora."""

from __future__ import annotations

from typing import Any

from geoalchemy2.elements import WKTElement
from sqlalchemy import delete, select
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
    Source,
    State,
)
from app.seeds.corpus_loader import build_manifest, validate_corpus_graph
from app.seeds.corpus_schema import CorpusPackage, SeedHistoricalDate, SeedSource
from app.services.publication import publish_event


def import_corpus(session: Session, corpus: CorpusPackage) -> dict[str, int]:
    """Validate then converge the database to the declared corpus in one transaction."""

    validate_corpus_graph(corpus)
    manifest = build_manifest(corpus)
    try:
        event_types = _upsert_event_types(session, corpus)
        sources = _upsert_sources(session, corpus)
        people = _upsert_people(session, corpus)
        places = _upsert_places(session, corpus)
        states = _upsert_states(session, corpus)
        session.flush()

        for item in corpus.events:
            start_date = _date(session, item.start_date)
            end_date = _date(session, item.end_date) if item.end_date else None
            event = _get_or_create(session, HistoricalEvent, "slug", item.slug)
            event.title_ar = item.title_ar
            event.title_en = item.title_en
            event.event_type_id = event_types[item.event_type].id
            event.start_date_id = start_date.id
            event.end_date_id = end_date.id if end_date else None
            event.primary_place_id = places[item.primary_place].id if item.primary_place else None
            event.summary_ar = item.summary_ar
            event.summary_en = item.summary_en
            event.causes_ar = item.causes_ar
            event.consequences_ar = item.consequences_ar
            event.importance = item.importance
            event.confidence_level = item.confidence_level
            event.publication_status = "reviewed" if item.publication_status == "published" else item.publication_status
            event.primary_geometry = _point(item.geometry)
            event.editorial_notes = item.editorial_notes
            session.flush()
            _reconcile_links(session, event, item, people, places, states, sources)
            session.flush()
            if item.publication_status == "published":
                session.expire(event, ["sources", "start_date", "end_date"])
                session.refresh(event, ["sources", "start_date", "end_date"])
                publish_event(event)
        session.commit()
    except Exception:
        session.rollback()
        raise
    return manifest.counts.model_dump()


def _upsert_event_types(session: Session, corpus: CorpusPackage) -> dict[str, EventType]:
    records: dict[str, EventType] = {}
    for item in corpus.event_types:
        record = _get_or_create(session, EventType, "code", item.code)
        record.name_ar = item.name_ar
        record.name_en = item.name_en
        record.icon_key = item.icon_key
        records[item.code] = record
    return records


def _upsert_sources(session: Session, corpus: CorpusPackage) -> dict[str, Source]:
    records: dict[str, Source] = {}
    for item in corpus.sources:
        record = _find_source(session, item)
        if record is None:
            record = Source(source_type=item.source_type, title=item.title)
            session.add(record)
        record.source_type = item.source_type
        record.title = item.title
        record.author = item.author
        record.edition = item.edition
        record.publication_data = item.publication_data
        record.url = str(item.url) if item.url else None
        record.notes = item.notes
        records[item.key] = record
    return records


def _find_source(session: Session, item: SeedSource) -> Source | None:
    if item.url:
        return session.scalar(select(Source).where(Source.url == str(item.url)))
    return session.scalar(
        select(Source).where(
            Source.url.is_(None),
            Source.title == item.title,
            Source.author == item.author,
            Source.edition == item.edition,
            Source.publication_data == item.publication_data,
        )
    )


def _upsert_people(session: Session, corpus: CorpusPackage) -> dict[str, Person]:
    records: dict[str, Person] = {}
    for item in corpus.people:
        record = _get_or_create(session, Person, "slug", item.slug)
        record.canonical_name_ar = item.canonical_name_ar
        record.canonical_name_en = item.canonical_name_en
        record.aliases = item.aliases
        record.birth_date_id = _date(session, item.birth_date).id if item.birth_date else None
        record.death_date_id = _date(session, item.death_date).id if item.death_date else None
        record.biography_ar = item.biography_ar
        record.confidence_level = item.confidence_level
        records[item.slug] = record
    return records


def _upsert_places(session: Session, corpus: CorpusPackage) -> dict[str, Place]:
    records: dict[str, Place] = {}
    for item in corpus.places:
        record = _get_or_create(session, Place, "slug", item.slug)
        record.name_ar = item.name_ar
        record.name_en = item.name_en
        record.place_type = item.place_type
        record.point = _point(item.point)
        record.modern_reference = item.modern_reference
        records[item.slug] = record
    return records


def _upsert_states(session: Session, corpus: CorpusPackage) -> dict[str, State]:
    records: dict[str, State] = {}
    for item in corpus.states:
        record = _get_or_create(session, State, "slug", item.slug)
        record.name_ar = item.name_ar
        record.name_en = item.name_en
        record.state_type = item.state_type
        record.start_date_id = _date(session, item.start_date).id if item.start_date else None
        record.end_date_id = _date(session, item.end_date).id if item.end_date else None
        record.relation_to_abbasid = item.relation_to_abbasid
        records[item.slug] = record
    return records


def _reconcile_links(
    session: Session,
    event: HistoricalEvent,
    item: Any,
    people: dict[str, Person],
    places: dict[str, Place],
    states: dict[str, State],
    sources: dict[str, Source],
) -> None:
    for model in (EventPerson, EventPlace, EventState, EventSource):
        session.execute(delete(model).where(model.event_id == event.id))
    for link in item.people:
        session.add(
            EventPerson(event_id=event.id, person_id=people[link.person].id, role_code=link.role_code)
        )
    for link in item.places:
        session.add(
            EventPlace(
                event_id=event.id,
                place_id=places[link.place].id,
                relation_type=link.relation_type,
            )
        )
    for link in item.states:
        session.add(
            EventState(
                event_id=event.id,
                state_id=states[link.state].id,
                relation_type=link.relation_type,
            )
        )
    for link in item.sources:
        session.add(
            EventSource(
                event_id=event.id,
                source_id=sources[link.source].id,
                citation_locator=link.citation_locator,
                support_type=link.support_type,
                reliability_note=link.reliability_note,
            )
        )


def _date(session: Session, item: SeedHistoricalDate) -> HistoricalDate:
    record = session.scalar(
        select(HistoricalDate).where(
            HistoricalDate.calendar == item.calendar,
            HistoricalDate.year == item.year,
            HistoricalDate.month == item.month,
            HistoricalDate.day == item.day,
            HistoricalDate.precision == item.precision,
            HistoricalDate.circa == item.circa,
            HistoricalDate.display_label_ar == item.display_label_ar,
            HistoricalDate.display_label_en == item.display_label_en,
        )
    )
    if record is None:
        record = HistoricalDate(**item.model_dump())
        session.add(record)
        session.flush()
    return record


def _get_or_create(session: Session, model: type, field: str, value: object):
    record = session.scalar(select(model).where(getattr(model, field) == value))
    if record is None:
        record = model(**{field: value})
        session.add(record)
    return record


def _point(coordinates: tuple[float, float] | None):
    if coordinates is None:
        return None
    longitude, latitude = coordinates
    return WKTElement(f"POINT({longitude} {latitude})", srid=4326)
