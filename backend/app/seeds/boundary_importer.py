"""Atomic, canonical, idempotent persistence for reviewed M-02 boundaries."""

from __future__ import annotations

from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.historical import (
    BoundarySource,
    HistoricalDate,
    PoliticalBoundary,
    Source,
    State,
)
from app.seeds.boundary_loader import build_boundary_manifest, validate_boundary_graph
from app.seeds.boundary_schema import BoundaryPackage
from app.seeds.corpus_schema import SeedHistoricalDate, SeedSource
from app.services.publication import publish_boundary


def import_boundary_package(
    session: Session, package: BoundaryPackage
) -> dict[str, int]:
    """Validate then atomically upsert the declared package by stable identities."""

    state_slugs = {feature.properties.state_slug for feature in package.boundaries.features}
    states = {
        record.slug: record
        for record in session.scalars(select(State).where(State.slug.in_(state_slugs)))
    }
    validate_boundary_graph(package, known_state_slugs=set(states))
    manifest = build_boundary_manifest(package)

    try:
        sources = _upsert_sources(session, package)
        session.flush()
        for feature in package.boundaries.features:
            item = feature.properties
            valid_from = _date(session, item.valid_from)
            valid_to = _date(session, item.valid_to)
            boundary = session.scalar(
                select(PoliticalBoundary).where(PoliticalBoundary.slug == item.slug)
            )
            if boundary is None:
                boundary = PoliticalBoundary(slug=item.slug)
                session.add(boundary)

            boundary.state_id = states[item.state_slug].id
            boundary.valid_from_date_id = valid_from.id
            boundary.valid_to_date_id = valid_to.id
            boundary.geometry = from_shape(
                shape(feature.geometry.model_dump()), srid=item.srid
            )
            boundary.confidence_level = item.confidence_level
            boundary.spatial_precision = item.spatial_precision
            boundary.publication_status = (
                "reviewed" if item.publication_status == "published" else item.publication_status
            )
            boundary.notes = item.reconstruction_notes_ar
            boundary.methodology_notes = item.methodology_notes_ar
            boundary.limitations_notes = item.limitations_notes_ar
            boundary.overlap_justification = item.overlap_justification
            session.flush()

            session.execute(
                delete(BoundarySource).where(BoundarySource.boundary_id == boundary.id)
            )
            for link in item.sources:
                session.add(
                    BoundarySource(
                        boundary_id=boundary.id,
                        source_id=sources[link.source].id,
                        citation_locator=link.citation_locator,
                        support_type=link.support_type,
                        reliability_note=link.reliability_note,
                    )
                )
            session.flush()

            if item.publication_status == "published":
                session.expire(
                    boundary,
                    ["sources", "valid_from_date", "valid_to_date"],
                )
                session.refresh(
                    boundary,
                    ["sources", "valid_from_date", "valid_to_date"],
                )
                publish_boundary(boundary)
        session.commit()
    except Exception:
        session.rollback()
        raise

    return manifest.counts.model_dump()


def _upsert_sources(
    session: Session, package: BoundaryPackage
) -> dict[str, Source]:
    records: dict[str, Source] = {}
    for item in package.sources:
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
        by_url = session.scalar(select(Source).where(Source.url == str(item.url)))
        if by_url is not None:
            return by_url
    return session.scalar(
        select(Source).where(
            Source.title == item.title,
            Source.author == item.author,
            Source.edition == item.edition,
            Source.publication_data == item.publication_data,
        ).order_by(Source.url.is_not(None), Source.id).limit(1)
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
