"""ORM model for the curated, source-backed historical record."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from geoalchemy2 import Geometry
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

WGS84_SRID = 4326


class HistoricalCalendar(StrEnum):
    HIJRI = "hijri"
    GREGORIAN = "gregorian"
    MIXED_REFERENCE = "mixed_reference"


class DatePrecision(StrEnum):
    EXACT = "exact"
    MONTH = "month"
    YEAR = "year"
    APPROXIMATE = "approximate"
    DISPUTED = "disputed"


class PublicationStatus(StrEnum):
    DRAFT = "draft"
    REVIEWED = "reviewed"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class SpatialPrecision(StrEnum):
    EXACT = "exact"
    APPROXIMATE = "approximate"
    DISPUTED = "disputed"


def uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class HistoricalDate(Base):
    __tablename__ = "historical_dates"
    __table_args__ = (
        CheckConstraint("calendar IN ('hijri', 'gregorian', 'mixed_reference')", name="ck_dates_calendar"),
        CheckConstraint("precision IN ('exact', 'month', 'year', 'approximate', 'disputed')", name="ck_dates_precision"),
        CheckConstraint("month IS NULL OR month BETWEEN 1 AND 12", name="ck_dates_month"),
        CheckConstraint("day IS NULL OR day BETWEEN 1 AND 31", name="ck_dates_day"),
    )

    id = uuid_pk()
    calendar: Mapped[str] = mapped_column(String(32), nullable=False)
    year: Mapped[int] = mapped_column(nullable=False, index=True)
    month: Mapped[int | None] = mapped_column(nullable=True)
    day: Mapped[int | None] = mapped_column(nullable=True)
    precision: Mapped[str] = mapped_column(String(32), nullable=False)
    circa: Mapped[bool] = mapped_column(default=False, nullable=False)
    display_label_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_label_en: Mapped[str | None] = mapped_column(Text, nullable=True)


class EventType(Base):
    __tablename__ = "event_types"

    id = uuid_pk()
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    icon_key: Mapped[str | None] = mapped_column(String(128), nullable=True)


class HistoricalEvent(Base):
    __tablename__ = "historical_events"
    __table_args__ = (
        CheckConstraint("importance BETWEEN 1 AND 5", name="ck_events_importance"),
        CheckConstraint("publication_status IN ('draft', 'reviewed', 'published', 'archived')", name="ck_events_status"),
    )

    id = uuid_pk()
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    title_ar: Mapped[str] = mapped_column(String(500), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    event_type_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("event_types.id"), nullable=True)
    start_date_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("historical_dates.id"), nullable=False)
    end_date_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("historical_dates.id"), nullable=True)
    primary_place_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("places.id"), nullable=True)
    summary_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    causes_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    consequences_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    importance: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    confidence_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    publication_status: Mapped[str] = mapped_column(String(32), default=PublicationStatus.DRAFT.value, nullable=False)
    primary_geometry: Mapped[object | None] = mapped_column(Geometry(geometry_type="GEOMETRY", srid=WGS84_SRID), nullable=True)
    editorial_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    start_date: Mapped[HistoricalDate] = relationship(foreign_keys=[start_date_id])
    end_date: Mapped[HistoricalDate | None] = relationship(foreign_keys=[end_date_id])
    event_type: Mapped[EventType | None] = relationship(foreign_keys=[event_type_id])
    primary_place: Mapped[Place | None] = relationship(foreign_keys=[primary_place_id])
    people: Mapped[list[Person]] = relationship(secondary="event_people", back_populates="events")
    places: Mapped[list[Place]] = relationship(secondary="event_places", back_populates="events")
    states: Mapped[list[State]] = relationship(secondary="event_states", back_populates="events")
    sources: Mapped[list[Source]] = relationship(secondary="event_sources", back_populates="events")


class Person(Base):
    __tablename__ = "people"
    id = uuid_pk()
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    canonical_name_ar: Mapped[str] = mapped_column(String(500), nullable=False)
    canonical_name_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    aliases: Mapped[str | None] = mapped_column(Text, nullable=True)
    birth_date_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("historical_dates.id"), nullable=True)
    death_date_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("historical_dates.id"), nullable=True)
    biography_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    biography_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    events: Mapped[list[HistoricalEvent]] = relationship(secondary="event_people", back_populates="people")


class Place(Base):
    __tablename__ = "places"
    id = uuid_pk()
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name_ar: Mapped[str] = mapped_column(String(500), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    place_type: Mapped[str] = mapped_column(String(64), nullable=False)
    point: Mapped[object | None] = mapped_column(Geometry(geometry_type="POINT", srid=WGS84_SRID), nullable=True)
    area: Mapped[object | None] = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=WGS84_SRID), nullable=True)
    modern_reference: Mapped[str | None] = mapped_column(String(500), nullable=True)
    events: Mapped[list[HistoricalEvent]] = relationship(secondary="event_places", back_populates="places")


class State(Base):
    __tablename__ = "states"
    id = uuid_pk()
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name_ar: Mapped[str] = mapped_column(String(500), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    state_type: Mapped[str] = mapped_column(String(64), nullable=False)
    start_date_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("historical_dates.id"), nullable=True)
    end_date_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("historical_dates.id"), nullable=True)
    relation_to_abbasid: Mapped[str | None] = mapped_column(String(128), nullable=True)
    events: Mapped[list[HistoricalEvent]] = relationship(secondary="event_states", back_populates="states")
    boundaries: Mapped[list[PoliticalBoundary]] = relationship(back_populates="state")


class PoliticalBoundary(Base):
    __tablename__ = "political_boundaries"
    __table_args__ = (
        CheckConstraint(
            "confidence_level IN ('high', 'medium', 'approximate', 'disputed')",
            name="ck_boundaries_confidence",
        ),
        CheckConstraint(
            "publication_status IN ('draft', 'reviewed', 'published', 'archived')",
            name="ck_boundaries_status",
        ),
        CheckConstraint(
            "spatial_precision IN ('exact', 'approximate', 'disputed')",
            name="ck_boundaries_spatial_precision",
        ),
        CheckConstraint("NOT ST_IsEmpty(geometry)", name="ck_boundaries_geometry_nonempty"),
        CheckConstraint("ST_IsValid(geometry)", name="ck_boundaries_geometry_valid"),
        CheckConstraint("ST_SRID(geometry) = 4326", name="ck_boundaries_geometry_srid"),
        UniqueConstraint("slug", name="uq_political_boundaries_slug"),
        Index("ix_political_boundaries_state_id", "state_id"),
    )

    id = uuid_pk()
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    state_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("states.id"), nullable=False)
    valid_from_date_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("historical_dates.id"), nullable=False)
    valid_to_date_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("historical_dates.id"), nullable=True)
    geometry: Mapped[object] = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=WGS84_SRID), nullable=False)
    confidence_level: Mapped[str] = mapped_column(String(32), nullable=False)
    spatial_precision: Mapped[str] = mapped_column(
        String(32), default=SpatialPrecision.APPROXIMATE.value, nullable=False
    )
    publication_status: Mapped[str] = mapped_column(
        String(32), default=PublicationStatus.DRAFT.value, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    methodology_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    limitations_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    overlap_justification: Mapped[str | None] = mapped_column(Text, nullable=True)

    state: Mapped[State] = relationship(back_populates="boundaries")
    valid_from_date: Mapped[HistoricalDate] = relationship(
        foreign_keys=[valid_from_date_id]
    )
    valid_to_date: Mapped[HistoricalDate | None] = relationship(
        foreign_keys=[valid_to_date_id]
    )
    sources: Mapped[list[Source]] = relationship(
        secondary="boundary_sources", back_populates="boundaries"
    )


class Source(Base):
    __tablename__ = "sources"
    id = uuid_pk()
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[str | None] = mapped_column(String(500), nullable=True)
    edition: Mapped[str | None] = mapped_column(String(500), nullable=True)
    publication_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    events: Mapped[list[HistoricalEvent]] = relationship(secondary="event_sources", back_populates="sources")
    boundaries: Mapped[list[PoliticalBoundary]] = relationship(
        secondary="boundary_sources", back_populates="sources"
    )


class BoundarySource(Base):
    __tablename__ = "boundary_sources"
    boundary_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("political_boundaries.id", ondelete="CASCADE"), primary_key=True
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sources.id", ondelete="CASCADE"), primary_key=True
    )
    citation_locator: Mapped[str | None] = mapped_column(Text, nullable=True)
    support_type: Mapped[str] = mapped_column(String(64), nullable=False)
    reliability_note: Mapped[str | None] = mapped_column(Text, nullable=True)


class EventPerson(Base):
    __tablename__ = "event_people"
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("historical_events.id", ondelete="CASCADE"), primary_key=True)
    person_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("people.id", ondelete="CASCADE"), primary_key=True)
    role_code: Mapped[str] = mapped_column(String(64), primary_key=True, default="", server_default="")


class EventPlace(Base):
    __tablename__ = "event_places"
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("historical_events.id", ondelete="CASCADE"), primary_key=True)
    place_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), primary_key=True)
    relation_type: Mapped[str] = mapped_column(String(64), primary_key=True)


class EventState(Base):
    __tablename__ = "event_states"
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("historical_events.id", ondelete="CASCADE"), primary_key=True)
    state_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("states.id", ondelete="CASCADE"), primary_key=True)
    relation_type: Mapped[str] = mapped_column(String(64), primary_key=True)


class EventSource(Base):
    __tablename__ = "event_sources"
    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("historical_events.id", ondelete="CASCADE"), primary_key=True
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sources.id", ondelete="CASCADE"), primary_key=True
    )
    citation_locator: Mapped[str | None] = mapped_column(Text, nullable=True)
    support_type: Mapped[str] = mapped_column(String(64), nullable=False)
    reliability_note: Mapped[str | None] = mapped_column(Text, nullable=True)
