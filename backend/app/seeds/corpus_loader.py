"""Load, validate, and summarize the structured M-01 corpus."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Iterable

from pydantic import ValidationError

from app.seeds.corpus_schema import CorpusCounts, CorpusManifest, CorpusPackage

CORPUS_MIN_YEAR = 132
CORPUS_MAX_YEAR = 170
DEFAULT_CORPUS_DIR = Path(__file__).resolve().parents[3] / "data" / "seed" / "m01"


class CorpusValidationError(ValueError):
    """A complete, actionable corpus validation failure."""


def load_corpus(
    corpus_dir: Path = DEFAULT_CORPUS_DIR, *, verify_expected_manifest: bool = True
) -> CorpusPackage:
    """Parse and validate the complete package before any persistence begins."""

    try:
        package = CorpusPackage.model_validate(
            {
                "event_types": _read_json(corpus_dir / "event_types.json"),
                "sources": _read_json(corpus_dir / "sources.json"),
                "people": _read_json(corpus_dir / "people.json"),
                "places": _read_json(corpus_dir / "places.json"),
                "states": _read_json(corpus_dir / "states.json"),
                "events": _read_json(corpus_dir / "events.json"),
            }
        )
    except (OSError, json.JSONDecodeError, ValidationError) as error:
        raise CorpusValidationError(f"invalid corpus package: {error}") from error
    validate_corpus_graph(package)
    if verify_expected_manifest:
        verify_manifest(package, corpus_dir / "manifest.json")
    return package


def validate_corpus_graph(corpus: CorpusPackage) -> None:
    """Validate uniqueness, references, publication, chronology, and scope."""

    errors: list[str] = []
    _check_duplicates("event type code", (item.code for item in corpus.event_types), errors)
    _check_duplicates("source key", (item.key for item in corpus.sources), errors)
    _check_duplicates("person slug", (item.slug for item in corpus.people), errors)
    _check_duplicates("place slug", (item.slug for item in corpus.places), errors)
    _check_duplicates("state slug", (item.slug for item in corpus.states), errors)
    _check_duplicates("event slug", (item.slug for item in corpus.events), errors)

    event_types = {item.code for item in corpus.event_types}
    source_keys = {item.key for item in corpus.sources}
    people = {item.slug for item in corpus.people}
    places = {item.slug for item in corpus.places}
    states = {item.slug for item in corpus.states}

    for event in corpus.events:
        prefix = f"event {event.slug}"
        if event.event_type not in event_types:
            errors.append(f"{prefix} references unknown event type {event.event_type}")
        if event.publication_status == "published" and not event.sources:
            errors.append(f"{prefix} is published without a source")
        if event.start_date.calendar != "hijri":
            errors.append(f"{prefix} must have a Hijri start date")
        if not CORPUS_MIN_YEAR <= event.start_date.year <= CORPUS_MAX_YEAR:
            errors.append(f"{prefix} start year is outside 132-170 AH")
        if event.end_date:
            if event.end_date.calendar != "hijri":
                errors.append(f"{prefix} must have a Hijri end date")
            if event.end_date.year < event.start_date.year:
                errors.append(f"{prefix} end year precedes start year")
            if event.end_date.year > CORPUS_MAX_YEAR:
                errors.append(f"{prefix} end year is outside 132-170 AH")
        if event.primary_place and event.primary_place not in places:
            errors.append(f"{prefix} references missing primary place {event.primary_place}")
        _check_links(prefix, "person", (link.person for link in event.people), people, errors)
        _check_links(prefix, "place", (link.place for link in event.places), places, errors)
        _check_links(prefix, "state", (link.state for link in event.states), states, errors)
        _check_links(prefix, "source", (link.source for link in event.sources), source_keys, errors)
        if event.primary_place and event.primary_place not in {link.place for link in event.places}:
            errors.append(f"{prefix} primary place is missing from place relationships")

    if errors:
        raise CorpusValidationError("; ".join(errors))


def build_manifest(corpus: CorpusPackage) -> CorpusManifest:
    """Produce the deterministic, reviewable summary for the validated package."""

    places = {place.slug: place for place in corpus.places}
    years = {year: 0 for year in range(CORPUS_MIN_YEAR, CORPUS_MAX_YEAR + 1)}
    types: Counter[str] = Counter()
    non_spatial: list[str] = []
    uncertain: list[str] = []

    for event in corpus.events:
        if event.publication_status != "published":
            continue
        end_year = event.end_date.year if event.end_date else event.start_date.year
        for year in range(event.start_date.year, end_year + 1):
            if year in years:
                years[year] += 1
        types[event.event_type] += 1
        place = places.get(event.primary_place) if event.primary_place else None
        if event.geometry is None and (place is None or place.point is None):
            non_spatial.append(event.slug)
        dates = [event.start_date, event.end_date]
        if any(
            date and (date.precision in {"approximate", "disputed"} or date.circa)
            for date in dates
        ):
            uncertain.append(event.slug)

    return CorpusManifest(
        counts=CorpusCounts(
            events=len(corpus.events),
            people=len(corpus.people),
            places=len(corpus.places),
            states=len(corpus.states),
            sources=len(corpus.sources),
            event_types=len(corpus.event_types),
        ),
        events_by_year=years,
        events_by_type=dict(sorted(types.items())),
        non_spatial_events=sorted(non_spatial),
        approximate_or_disputed_events=sorted(uncertain),
    )


def verify_manifest(corpus: CorpusPackage, manifest_path: Path) -> CorpusManifest:
    actual = build_manifest(corpus)
    try:
        expected = CorpusManifest.model_validate(_read_json(manifest_path))
    except (OSError, json.JSONDecodeError, ValidationError) as error:
        raise CorpusValidationError(f"invalid corpus manifest: {error}") from error
    if expected.model_dump(mode="json") != actual.model_dump(mode="json"):
        raise CorpusValidationError("corpus manifest does not match validated seed data")
    return actual


def _read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def _check_duplicates(label: str, values: Iterable[str], errors: list[str]) -> None:
    counts = Counter(values)
    for value in sorted(item for item, count in counts.items() if count > 1):
        errors.append(f"duplicate {label}: {value}")


def _check_links(
    prefix: str, label: str, values: Iterable[str], known: set[str], errors: list[str]
) -> None:
    for value in values:
        if value not in known:
            errors.append(f"{prefix} references missing {label} {value}")
