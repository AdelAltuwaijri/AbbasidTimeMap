"""Queries for public, published historical-event details."""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.historical import EventSource, HistoricalEvent, PublicationStatus
from app.schemas.events import (
    EventDetail,
    EventSourceDetail,
    EventTypeDetail,
    PersonDetail,
    PlaceDetail,
    StateDetail,
)


def get_published_event_detail(session: Session, slug: str) -> EventDetail | None:
    """Return a complete public projection or ``None`` for unknown/non-public slugs."""

    event = session.scalar(
        select(HistoricalEvent)
        .where(
            HistoricalEvent.slug == slug,
            HistoricalEvent.publication_status == PublicationStatus.PUBLISHED.value,
        )
        .options(
            joinedload(HistoricalEvent.start_date),
            joinedload(HistoricalEvent.end_date),
            joinedload(HistoricalEvent.event_type),
            joinedload(HistoricalEvent.primary_place),
            selectinload(HistoricalEvent.people),
            selectinload(HistoricalEvent.states),
            selectinload(HistoricalEvent.sources),
        )
    )
    if event is None:
        return None

    event_sources = {
        row.source_id: row
        for row in session.scalars(select(EventSource).where(EventSource.event_id == event.id)).all()
    }
    start = event.start_date
    return EventDetail(
        id=event.id,
        slug=event.slug,
        title_ar=event.title_ar,
        title_en=event.title_en,
        date_display_ar=start.display_label_ar or f"{start.year} هـ",
        date_display_en=start.display_label_en,
        year_start_hijri=start.year,
        year_end_hijri=event.end_date.year if event.end_date else None,
        gregorian_reference=_gregorian_reference(start.display_label_en),
        event_type=(
            EventTypeDetail(code=event.event_type.code, name_ar=event.event_type.name_ar, name_en=event.event_type.name_en)
            if event.event_type else None
        ),
        summary_ar=event.summary_ar,
        importance=event.importance,
        confidence=event.confidence_level,
        primary_place=(
            PlaceDetail(slug=event.primary_place.slug, name_ar=event.primary_place.name_ar, name_en=event.primary_place.name_en)
            if event.primary_place else None
        ),
        related_people=[PersonDetail(slug=person.slug, name_ar=person.canonical_name_ar, name_en=person.canonical_name_en) for person in event.people],
        related_states=[StateDetail(slug=state.slug, name_ar=state.name_ar, name_en=state.name_en) for state in event.states],
        sources=[
            EventSourceDetail(
                title=source.title, author=source.author, edition=source.edition,
                publication_data=source.publication_data, url=source.url,
                citation_locator=event_sources[source.id].citation_locator,
                support_type=event_sources[source.id].support_type,
                reliability_note=event_sources[source.id].reliability_note,
            )
            for source in event.sources
            if source.id in event_sources
        ],
    )


def _gregorian_reference(display_label_en: str | None) -> str | None:
    """Return the stored Gregorian portion of a bilingual display label, when present."""

    if not display_label_en or " / " not in display_label_en:
        return None
    return display_label_en.rsplit(" / ", 1)[1]
