"""Explicit idempotent seed for F-05; never imported by application startup."""

from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_session_factory
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
from app.services.publication import publish_event

EVENT_SLUG = "founding-of-baghdad"
SOURCE_URL = "https://www.iranicaonline.org/articles/baghdad/baghdad-iranian-connection-i-pr-mongol/"


def seed(session: Session) -> HistoricalEvent:
    """Create or refresh F-05's single reviewed historical record safely."""

    event_type = _get_or_create(session, EventType, "code", "city_founded", name_ar="تأسيس مدينة", name_en="City foundation", icon_key="city")
    date = _get_or_create(session, HistoricalDate, "display_label_en", "145 AH / 762 CE", calendar="hijri", year=145, precision="year", circa=False, display_label_ar="145 هـ (762 م)")
    place = _get_or_create(session, Place, "slug", "baghdad", name_ar="بغداد", name_en="Baghdad", place_type="city", modern_reference="نقطة مرجعية تقريبية لبغداد الحديثة؛ لا تمثل مركز المدينة المدورة الأثري بدقة.", point=WKTElement("POINT(44.3661 33.3152)", srid=4326))
    source = _get_or_create(session, Source, "url", SOURCE_URL, source_type="scholarly_encyclopedia", title="BAGHDAD i. The Iranian Connection: Before the Mongol Invasion", author="Hugh Kennedy", publication_data="Encyclopaedia Iranica, Vol. III, Fasc. 4, pp. 412–415 (1988; updated 2016)", notes="States that Baghdad was founded in 145/762 by Abū Jaʿfar al-Manṣūr as official capital.")
    person = _get_or_create(session, Person, "slug", "al-mansur", canonical_name_ar="أبو جعفر المنصور", canonical_name_en="Abū Jaʿfar al-Manṣūr", confidence_level="high")
    state = _get_or_create(session, State, "slug", "abbasid-caliphate", name_ar="الخلافة العباسية", name_en="Abbasid Caliphate", state_type="caliphate", relation_to_abbasid="self")
    session.flush()

    event = session.scalar(select(HistoricalEvent).where(HistoricalEvent.slug == EVENT_SLUG))
    if event is None:
        event = HistoricalEvent(slug=EVENT_SLUG)
        session.add(event)
    event.title_ar = "تأسيس بغداد"
    event.title_en = "Founding of Baghdad"
    event.event_type_id = event_type.id
    event.start_date_id = date.id
    event.primary_place_id = place.id
    event.primary_geometry = WKTElement("POINT(44.3661 33.3152)", srid=4326)
    event.summary_ar = "أسس الخليفة العباسي الثاني أبو جعفر المنصور بغداد سنة 145هـ/762م لتكون عاصمته الرسمية."
    event.importance = 5
    event.confidence_level = "high"
    event.editorial_notes = "الموضع نقطة مرجعية تقريبية لبغداد، لا تحديد أثري دقيق لمركز المدينة المدورة."
    session.flush()
    _link(session, EventPlace, event_id=event.id, place_id=place.id, relation_type="primary")
    _link(session, EventPerson, event_id=event.id, person_id=person.id, role_code="founder")
    _link(session, EventState, event_id=event.id, state_id=state.id, relation_type="capital_founded_for")
    _link(session, EventSource, event_id=event.id, source_id=source.id, citation_locator="Opening paragraph: ‘founded in 145/762’ by al-Manṣūr as official capital.", support_type="direct", reliability_note="Scholarly encyclopaedia article by Hugh Kennedy.")
    session.flush()
    session.refresh(event, ["sources", "start_date", "end_date"])
    publish_event(event)
    session.commit()
    return event


def _get_or_create(session: Session, model: type, field: str, value: object, **values: object):
    record = session.scalar(select(model).where(getattr(model, field) == value))
    if record is None:
        record = model(**{field: value, **values})
        session.add(record)
        session.flush()
    return record


def _link(session: Session, model: type, **values: object) -> None:
    exists = session.scalar(select(model).filter_by(**values))
    if exists is None:
        session.add(model(**values))


def main() -> None:
    session = get_session_factory()()
    try:
        seed(session)
    finally:
        session.close()


if __name__ == "__main__":
    main()
