"""Queries for public, published historical-event details."""

import unicodedata
from collections.abc import Iterable
from urllib.parse import urlsplit
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.historical import (
    EventPerson,
    EventPlace,
    EventSource,
    EventState,
    HistoricalEvent,
    PublicationStatus,
)
from app.schemas.events import (
    EventDetail,
    EventSourceDetail,
    EventTypeDetail,
    HistoricalDateDetail,
    PersonDetail,
    PlaceDetail,
    RelatedPlaceDetail,
    StateDetail,
)

PUBLIC_EVENT_CONFIDENCE_LEVELS = (
    "high",
    "medium",
    "disputed",
    "legendary/late-tradition",
)


def get_published_event_detail(session: Session, slug: str) -> EventDetail | None:
    """Return a complete public projection or ``None`` for unknown/non-public slugs."""

    event = session.scalar(
        select(HistoricalEvent)
        .where(
            HistoricalEvent.slug == slug,
            HistoricalEvent.publication_status == PublicationStatus.PUBLISHED.value,
            HistoricalEvent.confidence_level.in_(PUBLIC_EVENT_CONFIDENCE_LEVELS),
            HistoricalEvent.sources.any(),
        )
        .options(
            joinedload(HistoricalEvent.start_date),
            joinedload(HistoricalEvent.end_date),
            joinedload(HistoricalEvent.event_type),
            joinedload(HistoricalEvent.primary_place),
            selectinload(HistoricalEvent.people),
            selectinload(HistoricalEvent.places),
            selectinload(HistoricalEvent.states),
            selectinload(HistoricalEvent.sources),
        )
    )
    if event is None or event.confidence_level not in PUBLIC_EVENT_CONFIDENCE_LEVELS:
        return None

    source_links = session.scalars(
        select(EventSource).where(EventSource.event_id == event.id)
    ).all()
    if not source_links:
        return None

    person_links = session.scalars(
        select(EventPerson).where(EventPerson.event_id == event.id)
    ).all()
    place_links = session.scalars(
        select(EventPlace).where(EventPlace.event_id == event.id)
    ).all()
    state_links = session.scalars(
        select(EventState).where(EventState.event_id == event.id)
    ).all()

    start = event.start_date
    related_people = _related_people(event.people, person_links)
    related_places = _related_places(
        event.places,
        place_links,
        primary_place_id=event.primary_place.id if event.primary_place else None,
    )
    related_states = _related_states(event.states, state_links)
    sources = _event_sources(event.sources, source_links)
    if not sources:
        return None

    return EventDetail(
        id=event.id,
        slug=event.slug,
        title_ar=event.title_ar,
        title_en=event.title_en,
        start_date=_date_detail(start),
        end_date=_date_detail(event.end_date) if event.end_date else None,
        date_display_ar=start.display_label_ar or f"{start.year} هـ",
        date_display_en=start.display_label_en,
        year_start_hijri=start.year,
        year_end_hijri=event.end_date.year if event.end_date else None,
        gregorian_reference=_gregorian_reference(start.display_label_en),
        event_type=(
            EventTypeDetail(
                code=event.event_type.code,
                name_ar=event.event_type.name_ar,
                name_en=event.event_type.name_en,
            )
            if event.event_type else None
        ),
        summary_ar=event.summary_ar,
        summary_en=event.summary_en,
        causes_ar=event.causes_ar,
        consequences_ar=event.consequences_ar,
        importance=event.importance,
        confidence=event.confidence_level,
        primary_place=(
            PlaceDetail(
                id=event.primary_place.id,
                slug=event.primary_place.slug,
                name_ar=event.primary_place.name_ar,
                name_en=event.primary_place.name_en,
            )
            if event.primary_place else None
        ),
        related_people=related_people,
        related_places=related_places,
        related_states=related_states,
        sources=sources,
    )


def _date_detail(value) -> HistoricalDateDetail:
    return HistoricalDateDetail(
        calendar=value.calendar,
        year=value.year,
        month=value.month,
        day=value.day,
        precision=value.precision,
        circa=value.circa,
        display_label_ar=value.display_label_ar,
        display_label_en=value.display_label_en,
    )


def _gregorian_reference(display_label_en: str | None) -> str | None:
    """Return the stored Gregorian portion of a bilingual display label, when present."""

    if not display_label_en or not display_label_en.strip():
        return None
    label = display_label_en.strip()
    if " / " in label:
        gregorian = label.rsplit(" / ", 1)[1].strip()
        return gregorian or None
    return label


def _related_people(people: Iterable, links: Iterable) -> list[PersonDetail]:
    people_by_id = {person.id: person for person in people}
    details = []
    for link in _distinct_association_links(links, "person_id", "role_code"):
        person_id = link.person_id
        person = people_by_id.get(person_id)
        if person is None:
            continue
        details.append(
            PersonDetail(
                id=person.id,
                slug=person.slug,
                name_ar=person.canonical_name_ar,
                name_en=person.canonical_name_en,
                role_code=link.role_code,
            )
        )
    return sorted(details, key=lambda item: (item.slug, item.role_code, str(item.id)))


def _related_places(
    places: Iterable,
    links: Iterable,
    *,
    primary_place_id: UUID | None,
) -> list[RelatedPlaceDetail]:
    places_by_id = {place.id: place for place in places}
    details = []
    for link in _distinct_association_links(links, "place_id", "relation_type"):
        place_id = link.place_id
        if place_id == primary_place_id:
            continue
        place = places_by_id.get(place_id)
        if place is None:
            continue
        details.append(
            RelatedPlaceDetail(
                id=place.id,
                slug=place.slug,
                name_ar=place.name_ar,
                name_en=place.name_en,
                relation_type=link.relation_type,
            )
        )
    return sorted(details, key=lambda item: (item.slug, item.relation_type, str(item.id)))


def _related_states(states: Iterable, links: Iterable) -> list[StateDetail]:
    states_by_id = {state.id: state for state in states}
    details = []
    for link in _distinct_association_links(links, "state_id", "relation_type"):
        state_id = link.state_id
        state = states_by_id.get(state_id)
        if state is None:
            continue
        details.append(
            StateDetail(
                id=state.id,
                slug=state.slug,
                name_ar=state.name_ar,
                name_en=state.name_en,
                relation_type=link.relation_type,
            )
        )
    return sorted(details, key=lambda item: (item.slug, item.relation_type, str(item.id)))


def _event_sources(sources: Iterable, links: Iterable) -> list[EventSourceDetail]:
    sources_by_id = {source.id: source for source in sources}
    details = []
    for link in _distinct_identity_links(links, "source_id", "support_type"):
        source_id = link.source_id
        source = sources_by_id.get(source_id)
        if source is None:
            continue
        details.append(
            EventSourceDetail(
                id=source.id,
                source_type=source.source_type,
                title=source.title,
                author=source.author,
                edition=source.edition,
                publication_data=source.publication_data,
                url=_public_http_url(source.url),
                citation_locator=link.citation_locator,
                support_type=link.support_type,
                reliability_note=link.reliability_note,
            )
        )
    return sorted(details, key=lambda item: (item.title.casefold(), str(item.id)))


def _ordered_links(links: Iterable, identity_field: str, metadata_field: str) -> list:
    return sorted(
        links,
        key=lambda row: (
            str(getattr(row, identity_field)),
            str(getattr(row, metadata_field) or ""),
        ),
    )


def _distinct_association_links(
    links: Iterable,
    identity_field: str,
    metadata_field: str,
) -> list:
    """Preserve every distinct entity/role association deterministically."""

    distinct = {}
    for link in _ordered_links(links, identity_field, metadata_field):
        key = (
            getattr(link, identity_field),
            getattr(link, metadata_field),
        )
        distinct.setdefault(key, link)
    return list(distinct.values())


def _distinct_identity_links(
    links: Iterable,
    identity_field: str,
    metadata_field: str,
) -> list:
    """Return one deterministic link per identity for one-to-one projections."""

    distinct = {}
    for link in _ordered_links(links, identity_field, metadata_field):
        distinct.setdefault(getattr(link, identity_field), link)
    return list(distinct.values())


def _valid_hostname(hostname: str) -> bool:
    """Validate a DNS hostname after URL parsing and IDNA conversion."""

    try:
        ascii_hostname = hostname.encode("idna").decode("ascii")
    except UnicodeError:
        return False

    # A colon here represents an IPv6 literal already validated by urlsplit.
    if ":" in ascii_hostname:
        return True

    normalized = ascii_hostname.rstrip(".")
    if not normalized or len(normalized) > 253:
        return False
    labels = normalized.split(".")
    return all(
        label
        and len(label) <= 63
        and not label.startswith("-")
        and not label.endswith("-")
        and all(character.isalnum() or character == "-" for character in label)
        for label in labels
    )


def _public_http_url(value: str | None) -> str | None:
    if not value or not value.strip():
        return None
    candidate = value.strip()
    if "\\" in candidate or any(
        unicodedata.category(character).startswith("C") for character in candidate
    ):
        return None
    if any(character.isspace() for character in candidate):
        return None
    try:
        parsed = urlsplit(candidate)
        port = parsed.port
    except ValueError:
        return None
    scheme = parsed.scheme.lower()
    if (
        scheme not in {"http", "https"}
        or not parsed.netloc
        or parsed.netloc.endswith(":")
        or not parsed.hostname
    ):
        return None
    if parsed.username is not None or parsed.password is not None:
        return None
    if "%" in parsed.netloc or not _valid_hostname(parsed.hostname):
        return None
    if port is not None and not 1 <= port <= 65535:
        return None
    return parsed._replace(scheme=scheme).geturl()
