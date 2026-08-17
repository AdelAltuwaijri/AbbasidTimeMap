"""Publication workflow rules for curated historical events."""

from app.models.historical import HistoricalEvent, PublicationStatus


class PublicationValidationError(ValueError):
    """Raised when an event does not meet public-record requirements."""


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
