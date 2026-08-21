"""Load, validate, and summarize the reviewed M-02 boundary package."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Iterable

from pydantic import ValidationError

from app.seeds.boundary_schema import (
    BoundaryCounts,
    BoundaryManifest,
    BoundaryPackage,
    BoundaryPeriod,
)

BOUNDARY_MIN_YEAR = 132
BOUNDARY_MAX_YEAR = 170
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_BOUNDARY_DIR = REPOSITORY_ROOT / "data" / "boundaries" / "m02"
DEFAULT_STATE_FILE = REPOSITORY_ROOT / "data" / "seed" / "m01" / "states.json"


class BoundaryValidationError(ValueError):
    """A complete, actionable boundary-package validation failure."""


def load_boundary_package(
    boundary_dir: Path = DEFAULT_BOUNDARY_DIR,
    *,
    verify_expected_manifest: bool = True,
    state_file: Path = DEFAULT_STATE_FILE,
) -> BoundaryPackage:
    """Parse and validate all reviewed files without mutating the database."""

    try:
        package = BoundaryPackage.model_validate(
            {
                "sources": _read_json(boundary_dir / "sources.json"),
                "boundaries": _read_json(boundary_dir / "boundaries.geojson"),
            }
        )
        known_states = {item["slug"] for item in _read_json(state_file)}
    except (OSError, KeyError, TypeError, json.JSONDecodeError, ValidationError) as error:
        raise BoundaryValidationError(f"invalid boundary package: {error}") from error

    validate_boundary_graph(package, known_state_slugs=known_states)
    if verify_expected_manifest:
        verify_boundary_manifest(package, boundary_dir / "manifest.json")
    return package


def validate_boundary_graph(
    package: BoundaryPackage, *, known_state_slugs: set[str]
) -> None:
    """Validate stable identity, relationships, publication, chronology, and overlap."""

    errors: list[str] = []
    _check_duplicates("source key", (item.key for item in package.sources), errors)
    _check_duplicates(
        "boundary slug", (item.properties.slug for item in package.boundaries.features), errors
    )
    source_keys = {item.key for item in package.sources}

    by_state: dict[str, list] = {}
    for feature in package.boundaries.features:
        item = feature.properties
        prefix = f"boundary {item.slug}"
        by_state.setdefault(item.state_slug, []).append(item)
        if item.state_slug not in known_state_slugs:
            errors.append(f"{prefix} references missing state {item.state_slug}")
        if item.valid_from.calendar != "hijri" or item.valid_to.calendar != "hijri":
            errors.append(f"{prefix} validity dates must use the Hijri calendar")
        if item.valid_to.year < item.valid_from.year:
            errors.append(f"{prefix} end year precedes start year")
        if not BOUNDARY_MIN_YEAR <= item.valid_from.year <= BOUNDARY_MAX_YEAR:
            errors.append(f"{prefix} start year is outside 132-170 AH")
        if not BOUNDARY_MIN_YEAR <= item.valid_to.year <= BOUNDARY_MAX_YEAR:
            errors.append(f"{prefix} end year is outside 132-170 AH")
        if item.publication_status == "published" and not item.sources:
            errors.append(f"{prefix} is published without a source")
        for link in item.sources:
            if link.source not in source_keys:
                errors.append(f"{prefix} references missing source {link.source}")

    for state_slug, records in by_state.items():
        ordered = sorted(records, key=lambda item: (item.valid_from.year, item.valid_to.year))
        for current, following in zip(ordered, ordered[1:], strict=False):
            if following.valid_from.year <= current.valid_to.year and not (
                current.overlap_justification and following.overlap_justification
            ):
                errors.append(
                    f"boundaries {current.slug} and {following.slug} have an unintentional "
                    f"overlap for state {state_slug}"
                )

    if errors:
        raise BoundaryValidationError("; ".join(errors))


def build_boundary_manifest(package: BoundaryPackage) -> BoundaryManifest:
    """Build the deterministic review summary from validated in-memory data."""

    features = sorted(package.boundaries.features, key=lambda item: item.properties.slug)
    confidence = Counter(item.properties.confidence_level for item in features)
    precision = Counter(item.properties.spatial_precision for item in features)
    states = {item.properties.state_slug for item in features}
    return BoundaryManifest(
        counts=BoundaryCounts(
            boundaries=len(features), sources=len(package.sources), states=len(states)
        ),
        periods=[
            BoundaryPeriod(
                slug=item.properties.slug,
                state_slug=item.properties.state_slug,
                valid_from_hijri=item.properties.valid_from.year,
                valid_to_hijri=item.properties.valid_to.year,
            )
            for item in sorted(
                features,
                key=lambda feature: (
                    feature.properties.valid_from.year,
                    feature.properties.slug,
                ),
            )
        ],
        by_confidence=dict(sorted(confidence.items())),
        by_spatial_precision=dict(sorted(precision.items())),
        total_vertices=sum(item.geometry.vertex_count() for item in features),
    )


def verify_boundary_manifest(
    package: BoundaryPackage, manifest_path: Path
) -> BoundaryManifest:
    actual = build_boundary_manifest(package)
    try:
        expected = BoundaryManifest.model_validate(_read_json(manifest_path))
    except (OSError, json.JSONDecodeError, ValidationError) as error:
        raise BoundaryValidationError(f"invalid boundary manifest: {error}") from error
    if expected.model_dump(mode="json") != actual.model_dump(mode="json"):
        raise BoundaryValidationError("boundary manifest does not match validated GeoJSON")
    return actual


def _read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def _check_duplicates(label: str, values: Iterable[str], errors: list[str]) -> None:
    counts = Counter(values)
    for value in sorted(item for item, count in counts.items() if count > 1):
        errors.append(f"duplicate {label}: {value}")
