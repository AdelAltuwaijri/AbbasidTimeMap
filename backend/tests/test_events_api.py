from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.db.session import get_session
from app.main import app
from app.models.historical import EventPerson, EventPlace, EventSource, EventState
from app.schemas.events import HistoricalDateDetail
from app.services.events import _public_http_url


class Scalars:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


class Session:
    def __init__(self, event, rows_by_model=None):
        self.event = event
        self.rows_by_model = rows_by_model or {}

    def scalar(self, _statement):
        return self.event

    def scalars(self, statement):
        entity = statement.column_descriptions[0]["entity"]
        return Scalars(self.rows_by_model.get(entity, []))


def historical_date(
    year,
    *,
    precision="year",
    circa=False,
    display_label_ar=None,
    display_label_en=None,
    month=None,
    day=None,
):
    return SimpleNamespace(
        calendar="hijri",
        year=year,
        month=month,
        day=day,
        precision=precision,
        circa=circa,
        display_label_ar=display_label_ar,
        display_label_en=display_label_en,
    )


def published_event():
    primary_place = SimpleNamespace(
        id=uuid4(), slug="baghdad", name_ar="بغداد", name_en="Baghdad"
    )
    related_place = SimpleNamespace(
        id=uuid4(), slug="khorasan", name_ar="خراسان", name_en="Khurasan"
    )
    first_person = SimpleNamespace(
        id=uuid4(),
        slug="al-mansur",
        canonical_name_ar="أبو جعفر المنصور",
        canonical_name_en="Abū Jaʿfar al-Manṣūr",
    )
    second_person = SimpleNamespace(
        id=uuid4(),
        slug="abu-muslim",
        canonical_name_ar="أبو مسلم الخراساني",
        canonical_name_en="Abū Muslim al-Khurāsānī",
    )
    first_state = SimpleNamespace(
        id=uuid4(),
        slug="abbasid-caliphate",
        name_ar="الخلافة العباسية",
        name_en="Abbasid Caliphate",
    )
    second_state = SimpleNamespace(
        id=uuid4(),
        slug="umayyad-caliphate",
        name_ar="الخلافة الأموية",
        name_en="Umayyad Caliphate",
    )
    first_source = SimpleNamespace(
        id=uuid4(),
        source_type="scholarly_encyclopedia",
        title="BAGHDAD i. The Iranian Connection",
        author="Hugh Kennedy",
        edition=None,
        publication_data="Encyclopaedia Iranica",
        url="https://example.test/source",
        notes="PRIVATE SOURCE NOTE",
    )
    second_source = SimpleNamespace(
        id=uuid4(),
        source_type="chronicle_translation",
        title="The History of al-Tabari, Vol. 29",
        author="al-Tabari",
        edition="SUNY translation",
        publication_data="SUNY Press",
        url="javascript:alert(1)",
        notes="PRIVATE SOURCE NOTE",
    )
    event = SimpleNamespace(
        id=uuid4(),
        slug="construction-of-round-city",
        title_ar="بناء المدينة المدورة",
        title_en="Construction of the Round City",
        start_date=historical_date(
            145,
            precision="year",
            display_label_ar="من 145هـ",
            display_label_en="from 762 CE",
        ),
        end_date=historical_date(
            149,
            precision="approximate",
            circa=True,
            display_label_ar="إلى نحو 149هـ",
            display_label_en="to c. 766 CE",
        ),
        event_type=SimpleNamespace(
            code="city_founded", name_ar="تأسيس مدينة", name_en="City foundation"
        ),
        summary_ar="ملخص موثق",
        summary_en="A sourced summary",
        causes_ar="أسباب موثقة للاختبار فقط.",
        consequences_ar="نتائج موثقة للاختبار فقط.",
        importance=5,
        confidence_level="medium",
        editorial_notes="PRIVATE EVENT NOTE",
        primary_place=primary_place,
        people=[second_person, first_person, first_person],
        places=[related_place, primary_place, related_place],
        states=[second_state, first_state, first_state],
        sources=[second_source, first_source, first_source],
    )
    rows_by_model = {
        EventPerson: [
            SimpleNamespace(person_id=second_person.id, role_code="organizer"),
            SimpleNamespace(person_id=first_person.id, role_code="founder"),
            SimpleNamespace(person_id=first_person.id, role_code="founder"),
            SimpleNamespace(person_id=first_person.id, role_code="patron"),
        ],
        EventPlace: [
            SimpleNamespace(place_id=primary_place.id, relation_type="primary"),
            SimpleNamespace(place_id=related_place.id, relation_type="regional_context"),
            SimpleNamespace(place_id=related_place.id, relation_type="regional_context"),
            SimpleNamespace(
                place_id=related_place.id, relation_type="administrative_context"
            ),
        ],
        EventState: [
            SimpleNamespace(state_id=second_state.id, relation_type="predecessor"),
            SimpleNamespace(state_id=first_state.id, relation_type="ruling_state"),
            SimpleNamespace(state_id=first_state.id, relation_type="ruling_state"),
            SimpleNamespace(state_id=first_state.id, relation_type="claimant"),
        ],
        EventSource: [
            SimpleNamespace(
                source_id=second_source.id,
                citation_locator="Events of 145 AH",
                support_type="chronological",
                reliability_note=None,
            ),
            SimpleNamespace(
                source_id=first_source.id,
                citation_locator="Opening paragraph",
                support_type="direct",
                reliability_note="Scholarly encyclopaedia",
            ),
            SimpleNamespace(
                source_id=first_source.id,
                citation_locator="Opening paragraph",
                support_type="direct",
                reliability_note="Scholarly encyclopaedia",
            ),
        ],
    }
    return event, rows_by_model


def request_event(event, rows_by_model, slug="construction-of-round-city"):
    app.dependency_overrides[get_session] = lambda: Session(event, rows_by_model)
    try:
        return TestClient(app).get(f"/api/v1/events/{slug}")
    finally:
        app.dependency_overrides.clear()


def test_event_detail_serializes_complete_public_projection():
    event, rows_by_model = published_event()

    response = request_event(event, rows_by_model)

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "construction-of-round-city"
    assert body["start_date"] == {
        "calendar": "hijri",
        "year": 145,
        "month": None,
        "day": None,
        "precision": "year",
        "circa": False,
        "display_label_ar": "من 145هـ",
        "display_label_en": "from 762 CE",
    }
    assert body["end_date"]["precision"] == "approximate"
    assert body["end_date"]["circa"] is True
    assert body["year_start_hijri"] == 145
    assert body["year_end_hijri"] == 149
    assert body["date_display_en"] == "from 762 CE"
    assert body["gregorian_reference"] == "from 762 CE"
    assert body["summary_en"] == "A sourced summary"
    assert body["causes_ar"] == "أسباب موثقة للاختبار فقط."
    assert body["consequences_ar"] == "نتائج موثقة للاختبار فقط."
    assert body["primary_place"]["id"] == str(event.primary_place.id)
    assert [
        (place["slug"], place["relation_type"])
        for place in body["related_places"]
    ] == [
        ("khorasan", "administrative_context"),
        ("khorasan", "regional_context"),
    ]


def test_generated_openapi_preserves_event_public_contract_constraints():
    openapi = app.openapi()
    operation = openapi["paths"]["/api/v1/events/{slug}"]["get"]
    schemas = openapi["components"]["schemas"]
    event_schema = schemas["EventDetail"]
    source_schema = schemas["EventSourceDetail"]

    assert operation["responses"]["404"]["description"] == (
        "Unknown, non-public, unsourced, or confidence-unclassified event"
    )
    assert event_schema["properties"]["confidence"]["enum"] == [
        "high",
        "medium",
        "disputed",
        "legendary/late-tradition",
    ]

    importance_integer = next(
        variant
        for variant in event_schema["properties"]["importance"]["anyOf"]
        if variant.get("type") == "integer"
    )
    assert importance_integer["minimum"] == 1
    assert importance_integer["maximum"] == 5
    assert event_schema["properties"]["sources"]["minItems"] == 1

    public_url = next(
        variant
        for variant in source_schema["properties"]["url"]["anyOf"]
        if variant.get("type") == "string"
    )
    assert public_url["format"] == "uri"
    assert public_url["pattern"] == "^https?://"


def test_relationships_are_typed_deduplicated_and_deterministically_ordered():
    event, rows_by_model = published_event()

    body = request_event(event, rows_by_model).json()

    assert [(person["slug"], person["role_code"]) for person in body["related_people"]] == [
        ("abu-muslim", "organizer"),
        ("al-mansur", "founder"),
        ("al-mansur", "patron"),
    ]
    assert [(state["slug"], state["relation_type"]) for state in body["related_states"]] == [
        ("abbasid-caliphate", "claimant"),
        ("abbasid-caliphate", "ruling_state"),
        ("umayyad-caliphate", "predecessor"),
    ]


def test_sources_are_rich_safe_private_and_deduplicated():
    event, rows_by_model = published_event()

    body = request_event(event, rows_by_model).json()

    assert len(body["sources"]) == 2
    assert [source["title"] for source in body["sources"]] == [
        "BAGHDAD i. The Iranian Connection",
        "The History of al-Tabari, Vol. 29",
    ]
    assert body["sources"][0] == {
        "id": str(event.sources[1].id),
        "source_type": "scholarly_encyclopedia",
        "title": "BAGHDAD i. The Iranian Connection",
        "author": "Hugh Kennedy",
        "edition": None,
        "publication_data": "Encyclopaedia Iranica",
        "url": "https://example.test/source",
        "citation_locator": "Opening paragraph",
        "support_type": "direct",
        "reliability_note": "Scholarly encyclopaedia",
    }
    assert body["sources"][1]["url"] is None
    assert "editorial_notes" not in body
    assert all("notes" not in source for source in body["sources"])


def test_combined_hijri_gregorian_label_keeps_only_gregorian_reference():
    event, rows_by_model = published_event()
    event.start_date.display_label_en = "145 AH / 762 CE"

    body = request_event(event, rows_by_model).json()

    assert body["gregorian_reference"] == "762 CE"


@pytest.mark.parametrize(
    ("precision", "circa", "month", "day", "label"),
    [
        ("exact", False, 12, 6, "6 ذو الحجة 132هـ"),
        ("month", False, 12, None, "ذو الحجة 132هـ"),
        ("year", False, None, None, "132هـ"),
        ("approximate", True, None, None, "نحو 132هـ"),
        ("disputed", True, None, None, "نحو 132هـ؛ مختلف في تحديده"),
    ],
)
def test_date_precision_and_circa_are_never_flattened(
    precision, circa, month, day, label
):
    event, rows_by_model = published_event()
    event.start_date = historical_date(
        132,
        precision=precision,
        circa=circa,
        month=month,
        day=day,
        display_label_ar=label,
        display_label_en="750 CE",
    )

    body = request_event(event, rows_by_model).json()

    assert body["date_display_ar"] == label
    assert body["start_date"] == {
        "calendar": "hijri",
        "year": 132,
        "month": month,
        "day": day,
        "precision": precision,
        "circa": circa,
        "display_label_ar": label,
        "display_label_en": "750 CE",
    }


def test_confidence_unclassified_or_unsourced_event_returns_404():
    event, rows_by_model = published_event()
    event.confidence_level = None
    assert request_event(event, rows_by_model).status_code == 404

    event.confidence_level = "high"
    rows_by_model[EventSource] = []
    assert request_event(event, rows_by_model).status_code == 404


@pytest.mark.parametrize("confidence", ["", " ", "bogus", "legendary"])
def test_invalid_confidence_classification_returns_404(confidence):
    event, rows_by_model = published_event()
    event.confidence_level = confidence

    assert request_event(event, rows_by_model).status_code == 404


@pytest.mark.parametrize(
    "confidence",
    ["high", "medium", "disputed", "legendary/late-tradition"],
)
def test_corpus_confidence_classifications_are_public(confidence):
    event, rows_by_model = published_event()
    event.confidence_level = confidence

    response = request_event(event, rows_by_model)

    assert response.status_code == 200
    assert response.json()["confidence"] == confidence


@pytest.mark.parametrize(
    "values",
    [
        {"calendar": "invalid", "year": 145, "precision": "year"},
        {"calendar": "hijri", "year": 0, "precision": "year"},
        {"calendar": "hijri", "year": 145, "month": 13, "precision": "month"},
        {"calendar": "hijri", "year": 145, "day": 1, "precision": "approximate"},
        {"calendar": "hijri", "year": 145, "precision": "exact"},
        {
            "calendar": "hijri",
            "year": 145,
            "month": 1,
            "day": 1,
            "precision": "month",
        },
        {"calendar": "hijri", "year": 145, "month": 1, "precision": "year"},
        {"calendar": "hijri", "year": 145, "precision": "unsupported"},
    ],
)
def test_structured_date_rejects_invalid_uncertainty_shapes(values):
    with pytest.raises(ValidationError):
        HistoricalDateDetail(circa=False, **values)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("https://example.test/source", "https://example.test/source"),
        (" HTTP://Example.test/path ", "http://Example.test/path"),
        ("javascript:alert(1)", None),
        ("data:text/html,unsafe", None),
        ("https://example.com:bad", None),
        ("https://example.com:", None),
        ("https://example.com:0", None),
        ("https://example.com:65536", None),
        ("https://%0d%0aevil.com", None),
        ("https://user:secret@example.com", None),
        ("https://example.com/\npath", None),
        ("https://example.com\\@evil.com", None),
        ("https://.", None),
        ("https:///missing-host", None),
    ],
)
def test_public_source_url_accepts_only_safe_well_formed_http_urls(value, expected):
    assert _public_http_url(value) == expected


def test_unknown_event_slug_returns_404():
    response = request_event(None, {}, slug="unknown")

    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"
