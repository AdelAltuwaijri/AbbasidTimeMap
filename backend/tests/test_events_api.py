from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.session import get_session
from app.main import app


class Scalars:
    def __init__(self, rows): self.rows = rows
    def all(self): return self.rows


class Session:
    def __init__(self, event, source_rows): self.event, self.source_rows = event, source_rows
    def scalar(self, _statement): return self.event
    def scalars(self, _statement): return Scalars(self.source_rows)


def published_event():
    source_id = uuid4()
    source = SimpleNamespace(id=source_id, title="BAGHDAD i. The Iranian Connection: Before the Mongol Invasion", author="Hugh Kennedy", edition=None, publication_data="Encyclopaedia Iranica", url="https://example.test/source", notes=None)
    return SimpleNamespace(
        id=uuid4(), slug="founding-of-baghdad", title_ar="تأسيس بغداد", title_en="Founding of Baghdad",
        start_date=SimpleNamespace(year=145, display_label_ar="145 هـ (762 م)", display_label_en="145 AH / 762 CE"), end_date=None,
        event_type=SimpleNamespace(code="city_founded", name_ar="تأسيس مدينة", name_en="City foundation"),
        summary_ar="ملخص موثق", importance=5, confidence_level="high",
        primary_place=SimpleNamespace(slug="baghdad", name_ar="بغداد", name_en="Baghdad"),
        people=[SimpleNamespace(slug="al-mansur", canonical_name_ar="أبو جعفر المنصور", canonical_name_en="Abū Jaʿfar al-Manṣūr")],
        states=[SimpleNamespace(slug="abbasid-caliphate", name_ar="الخلافة العباسية", name_en="Abbasid Caliphate")], sources=[source],
    ), [SimpleNamespace(source_id=source_id, citation_locator="Opening paragraph", support_type="direct", reliability_note="Scholarly encyclopaedia")]


def test_event_detail_returns_published_source_backed_event():
    event, source_rows = published_event()
    app.dependency_overrides[get_session] = lambda: Session(event, source_rows)
    try:
        response = TestClient(app).get("/api/v1/events/founding-of-baghdad")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "founding-of-baghdad"
    assert body["year_start_hijri"] == 145
    assert body["gregorian_reference"] == "762 CE"
    assert body["primary_place"]["slug"] == "baghdad"
    assert body["sources"][0]["author"] == "Hugh Kennedy"
    assert body["sources"][0]["citation_locator"] == "Opening paragraph"


def test_unknown_event_slug_returns_404():
    app.dependency_overrides[get_session] = lambda: Session(None, [])
    try:
        response = TestClient(app).get("/api/v1/events/unknown")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"
