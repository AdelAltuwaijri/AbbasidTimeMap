import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.seeds.corpus_loader import CorpusValidationError, build_manifest, validate_corpus_graph
from app.seeds.corpus_schema import (
    CorpusPackage,
    SeedEvent,
    SeedEventType,
    SeedHistoricalDate,
    SeedPerson,
    SeedPersonLink,
    SeedPlace,
    SeedPlaceLink,
    SeedSource,
    SeedSourceLink,
)


def historical_date(year: int = 145) -> SeedHistoricalDate:
    return SeedHistoricalDate(
        calendar="hijri",
        year=year,
        precision="year",
        display_label_ar=f"{year}هـ",
    )


def package() -> CorpusPackage:
    return CorpusPackage(
        event_types=[
            SeedEventType(code="political", name_ar="سياسي", name_en="Political")
        ],
        sources=[
            SeedSource(
                key="academic",
                source_type="modern_academic_monograph",
                title="Reviewed history",
                author="Historian",
                publication_data="Academic Press, 2020",
                url="https://example.test/history",
            )
        ],
        people=[
            SeedPerson(
                slug="person",
                canonical_name_ar="شخص",
                confidence_level="high",
            )
        ],
        places=[
            SeedPlace(
                slug="place",
                name_ar="مكان",
                place_type="city",
                point=(44.0, 33.0),
                modern_reference="نقطة جغرافية تقريبية للعرض.",
            )
        ],
        states=[],
        events=[
            SeedEvent(
                slug="event",
                title_ar="حدث",
                event_type="political",
                start_date=historical_date(),
                summary_ar="ملخص مراجع.",
                importance=3,
                confidence_level="high",
                publication_status="published",
                primary_place="place",
                people=[SeedPersonLink(person="person", role_code="participant")],
                places=[SeedPlaceLink(place="place", relation_type="primary")],
                sources=[
                    SeedSourceLink(
                        source="academic",
                        citation_locator="Chapter 1",
                        support_type="direct",
                    )
                ],
            )
        ],
    )


def test_valid_corpus_builds_deterministic_manifest():
    corpus = package()
    validate_corpus_graph(corpus)
    manifest = build_manifest(corpus)

    assert manifest.counts.events == 1
    assert manifest.events_by_year[145] == 1
    assert manifest.events_by_type == {"political": 1}
    assert manifest.non_spatial_events == []


@pytest.mark.parametrize(
    ("mutation", "message"),
    [
        (lambda corpus: corpus.events[0].model_copy(update={"sources": []}), "source"),
        (
            lambda corpus: corpus.events[0].model_copy(update={"event_type": "unknown"}),
            "event type",
        ),
        (
            lambda corpus: corpus.events[0].model_copy(
                update={"end_date": historical_date(144)}
            ),
            "end year",
        ),
        (
            lambda corpus: corpus.events[0].model_copy(
                update={"people": [SeedPersonLink(person="missing", role_code="participant")]}
            ),
            "person",
        ),
    ],
)
def test_graph_validation_rejects_material_errors(mutation, message):
    corpus = package()
    corpus.events[0] = mutation(corpus)

    with pytest.raises(CorpusValidationError, match=message):
        validate_corpus_graph(corpus)


def test_graph_validation_rejects_duplicate_slugs():
    corpus = package()
    corpus.events.append(corpus.events[0].model_copy())

    with pytest.raises(CorpusValidationError, match="duplicate event slug"):
        validate_corpus_graph(corpus)


def test_coordinate_validation_rejects_invalid_longitude():
    with pytest.raises(ValidationError, match="longitude"):
        SeedPlace(
            slug="invalid",
            name_ar="مكان",
            place_type="city",
            point=(181.0, 20.0),
            modern_reference="تقريبي",
        )


def test_manifest_drift_is_explicit(tmp_path: Path):
    corpus = package()
    actual = build_manifest(corpus)
    wrong = actual.model_dump(mode="json")
    wrong["counts"]["events"] = 99
    (tmp_path / "manifest.json").write_text(json.dumps(wrong), encoding="utf-8")

    from app.seeds.corpus_loader import verify_manifest

    with pytest.raises(CorpusValidationError, match="manifest"):
        verify_manifest(corpus, tmp_path / "manifest.json")
