"""Publication workflow rules for curated historical records."""

from app.models.historical import (
    HistoricalCalendar,
    HistoricalEvent,
    PoliticalBoundary,
    PublicationStatus,
)


class PublicationValidationError(ValueError):
    """Raised when a record does not meet public-record requirements."""


def publish_event(event: HistoricalEvent) -> None:
    """Mark an event published only after source provenance is attached."""
    validate_event_date_range(event)
    if not event.sources:
        raise PublicationValidationError("published events require at least one supporting source")
    event.publication_status = PublicationStatus.PUBLISHED.value


def validate_event_date_range(event: HistoricalEvent) -> None:
    """Reject an event range that is backwards in a comparable historical calendar."""
    if event.end_date is None:
        return
    if event.start_date.calendar == event.end_date.calendar and event.end_date.year < event.start_date.year:
        raise PublicationValidationError("event end year cannot be earlier than its start year")


def publish_boundary(boundary: PoliticalBoundary) -> None:
    """Publish a complete, sourced reconstruction with an ordered Hijri range."""

    validate_boundary_date_range(boundary)
    if not boundary.slug:
        raise PublicationValidationError("published boundaries require a stable slug")
    if boundary.state_id is None:
        raise PublicationValidationError("published boundaries require a historical state")
    if boundary.geometry is None:
        raise PublicationValidationError("published boundaries require geometry")
    if not boundary.notes or not boundary.notes.strip():
        raise PublicationValidationError("published boundaries require reconstruction notes")
    if not boundary.methodology_notes or not boundary.methodology_notes.strip():
        raise PublicationValidationError("published boundaries require methodology notes")
    if not boundary.limitations_notes or not boundary.limitations_notes.strip():
        raise PublicationValidationError("published boundaries require limitations notes")
    if boundary.confidence_level not in {"high", "medium", "approximate", "disputed"}:
        raise PublicationValidationError("published boundaries require a valid confidence level")
    if boundary.spatial_precision not in {"exact", "approximate", "disputed"}:
        raise PublicationValidationError("published boundaries require a valid spatial precision")
    if not boundary.sources:
        raise PublicationValidationError(
            "published boundaries require at least one supporting source"
        )
    boundary.publication_status = PublicationStatus.PUBLISHED.value


def validate_boundary_date_range(boundary: PoliticalBoundary) -> None:
    """Require inclusive Hijri validity dates in chronological order."""

    if boundary.valid_from_date is None or boundary.valid_to_date is None:
        raise PublicationValidationError(
            "published boundaries require valid-from and valid-to dates"
        )
    if (
        boundary.valid_from_date.calendar != HistoricalCalendar.HIJRI.value
        or boundary.valid_to_date.calendar != HistoricalCalendar.HIJRI.value
    ):
        raise PublicationValidationError("boundary validity dates must use the Hijri calendar")
    if boundary.valid_to_date.year < boundary.valid_from_date.year:
        raise PublicationValidationError(
            "boundary end year cannot be earlier than its start year"
        )
