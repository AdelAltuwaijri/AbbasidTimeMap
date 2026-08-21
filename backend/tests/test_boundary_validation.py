import json
from copy import deepcopy

import pytest
from pydantic import ValidationError

from app.seeds.boundary_loader import (
    BoundaryValidationError,
    build_boundary_manifest,
    validate_boundary_graph,
    verify_boundary_manifest,
)
from app.seeds.boundary_schema import BoundaryPackage


def source(key: str = "atlas") -> dict:
    return {
        "key": key,
        "source_type": "modern_academic_monograph",
        "title": f"Source {key}",
        "author": "Historian",
    }


def feature(
    slug: str = "abbasid-extent-132-143",
    *,
    start: int = 132,
    end: int = 143,
    state: str = "abbasid-caliphate",
) -> dict:
    return {
        "type": "Feature",
        "geometry": {
            "type": "MultiPolygon",
            "coordinates": [[[[30, 20], [40, 20], [40, 30], [30, 30], [30, 20]]]],
        },
        "properties": {
            "slug": slug,
            "state_slug": state,
            "valid_from": {
                "year": start,
                "precision": "year",
                "display_label_ar": f"{start}هـ",
            },
            "valid_to": {
                "year": end,
                "precision": "year",
                "display_label_ar": f"{end}هـ",
            },
            "confidence_level": "medium",
            "spatial_precision": "approximate",
            "publication_status": "published",
            "srid": 4326,
            "reconstruction_notes_ar": "إعادة بناء تقريبية وليست حدًا دوليًا دقيقًا.",
            "methodology_notes_ar": "إدراج الأقاليم ذات الإدارة والحاميات الموثقة.",
            "limitations_notes_ar": "المصادر تصف مراكز السيطرة أكثر من الخطوط الريفية.",
            "overlap_justification": None,
            "anchors": ["العراق", "خراسان"],
            "exclusions": ["الأندلس"],
            "sources": [
                {
                    "source": "atlas",
                    "citation_locator": "Map 5",
                    "support_type": "geographic_cross_check",
                    "reliability_note": "Macro cross-check only.",
                }
            ],
        },
    }


def package(*features: dict) -> BoundaryPackage:
    return BoundaryPackage.model_validate(
        {
            "sources": [source()],
            "boundaries": {"type": "FeatureCollection", "features": list(features)},
        }
    )


def test_valid_package_builds_deterministic_manifest() -> None:
    corpus = package(feature())
    validate_boundary_graph(corpus, known_state_slugs={"abbasid-caliphate"})

    manifest = build_boundary_manifest(corpus)

    assert manifest.counts.boundaries == 1
    assert manifest.periods[0].valid_from_hijri == 132
    assert manifest.by_confidence == {"medium": 1}
    assert manifest.by_spatial_precision == {"approximate": 1}
    assert manifest.total_vertices == 5


@pytest.mark.parametrize(
    ("mutation", "message"),
    [
        (lambda item: item["properties"].update(valid_to={"year": 131, "precision": "year", "display_label_ar": "131هـ"}), "end year"),
        (lambda item: item["properties"].update(state_slug="missing-state"), "missing state"),
        (lambda item: item["properties"].update(sources=[]), "published without a source"),
        (lambda item: item["properties"]["sources"][0].update(source="missing-source"), "missing source"),
    ],
)
def test_graph_validation_rejects_invalid_ranges_and_relationships(mutation, message) -> None:
    item = feature()
    mutation(item)
    corpus = package(item)

    with pytest.raises(BoundaryValidationError, match=message):
        validate_boundary_graph(corpus, known_state_slugs={"abbasid-caliphate"})


def test_duplicate_slug_is_rejected() -> None:
    corpus = package(feature(), feature())
    with pytest.raises(BoundaryValidationError, match="duplicate boundary slug"):
        validate_boundary_graph(corpus, known_state_slugs={"abbasid-caliphate"})


def test_unintentional_same_state_overlap_is_rejected() -> None:
    corpus = package(feature(end=145), feature("abbasid-extent-144-154", start=144, end=154))
    with pytest.raises(BoundaryValidationError, match="overlap"):
        validate_boundary_graph(corpus, known_state_slugs={"abbasid-caliphate"})


def test_documented_overlap_is_allowed() -> None:
    first = feature(end=145)
    second = feature("abbasid-contested-144-154", start=144, end=154)
    first["properties"]["overlap_justification"] = "طبقة متنازع عليها مقصودة."
    second["properties"]["overlap_justification"] = "طبقة متنازع عليها مقصودة."
    corpus = package(first, second)

    validate_boundary_graph(corpus, known_state_slugs={"abbasid-caliphate"})


def test_self_intersection_and_empty_geometry_are_rejected() -> None:
    invalid = feature()
    invalid["geometry"]["coordinates"] = [
        [[[0, 0], [2, 2], [2, 0], [0, 2], [0, 0]]]
    ]
    with pytest.raises(ValidationError, match="valid"):
        package(invalid)

    empty = feature()
    empty["geometry"]["coordinates"] = []
    with pytest.raises(ValidationError, match="empty"):
        package(empty)


def test_wrong_srid_and_out_of_range_coordinates_are_rejected() -> None:
    wrong_srid = feature()
    wrong_srid["properties"]["srid"] = 3857
    with pytest.raises(ValidationError, match="4326"):
        package(wrong_srid)

    outside = feature()
    outside["geometry"]["coordinates"] = [
        [[[181, 20], [182, 20], [182, 21], [181, 21], [181, 20]]]
    ]
    with pytest.raises(ValidationError, match="WGS84"):
        package(outside)


def test_manifest_drift_is_explicit(tmp_path) -> None:
    corpus = package(feature())
    expected = build_boundary_manifest(corpus).model_dump(mode="json")
    expected["counts"]["boundaries"] = 99
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps(expected), encoding="utf-8")

    with pytest.raises(BoundaryValidationError, match="manifest"):
        verify_boundary_manifest(corpus, path)


def test_extra_fields_are_rejected() -> None:
    item = deepcopy(feature())
    item["properties"]["modern_country"] = "forbidden"
    with pytest.raises(ValidationError, match="extra"):
        package(item)
