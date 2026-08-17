"""Validation schemas for historical-record creation and publication."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.historical import DatePrecision, HistoricalCalendar, PublicationStatus


class HistoricalDateCreate(BaseModel):
    calendar: HistoricalCalendar
    year: int
    month: int | None = Field(default=None, ge=1, le=12)
    day: int | None = Field(default=None, ge=1, le=31)
    precision: DatePrecision
    circa: bool = False
    display_label_ar: str | None = None
    display_label_en: str | None = None

    @model_validator(mode="after")
    def validate_precision_components(self) -> HistoricalDateCreate:
        if self.precision is DatePrecision.EXACT and (self.month is None or self.day is None):
            raise ValueError("exact historical dates require a month and day")
        if self.precision is DatePrecision.MONTH and self.month is None:
            raise ValueError("month-precision historical dates require a month")
        if self.precision is DatePrecision.YEAR and (self.month is not None or self.day is not None):
            raise ValueError("year-precision historical dates cannot include month or day")
        return self


class HistoricalEventCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=255)
    title_ar: str = Field(min_length=1, max_length=500)
    start_date_id: UUID
    end_date_id: UUID | None = None
    publication_status: PublicationStatus = PublicationStatus.DRAFT
    source_ids: list[UUID] = Field(default_factory=list)

    @model_validator(mode="after")
    def published_events_require_sources(self) -> HistoricalEventCreate:
        if self.publication_status is PublicationStatus.PUBLISHED and not self.source_ids:
            raise ValueError("published events require at least one supporting source")
        return self
