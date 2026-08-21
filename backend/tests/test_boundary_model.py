"""ORM, provenance, publication, and migration coverage for M-02 boundaries."""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

import pytest
from geoalchemy2 import Geometry

from app.models.historical import (
    WGS84_SRID,
    BoundarySource,
    HistoricalDate,
    PoliticalBoundary,
    PublicationStatus,
    Source,
    SpatialPrecision,
)
from app.services.publication import PublicationValidationError, publish_boundary


def boundary(*, start_year: int = 132, end_year: int = 143) -> PoliticalBoundary:
    return PoliticalBoundary(
        slug="abbasid-extent-132-143",
        state_id=uuid4(),
        valid_from_date_id=uuid4(),
        valid_to_date_id=uuid4(),
        geometry="MULTIPOLYGON(((30 20, 31 20, 31 21, 30 21, 30 20)))",
        confidence_level="medium",
        spatial_precision=SpatialPrecision.APPROXIMATE.value,
        publication_status=PublicationStatus.REVIEWED.value,
        notes="إعادة بناء تقريبية لمجال السيطرة وليست حدًا دوليًا دقيقًا.",
        methodology_notes="رُسم الغلاف من أقاليم السيطرة الموثقة دون تتبع حدود حديثة.",
        limitations_notes="لا تمثل الخطوط مسحًا ميدانيًا ولا دقة حدودية حديثة.",
        valid_from_date=HistoricalDate(calendar="hijri", year=start_year, precision="year"),
        valid_to_date=HistoricalDate(calendar="hijri", year=end_year, precision="year"),
    )


def test_boundary_model_has_stable_identity_uncertainty_and_provenance() -> None:
    record = boundary()
    source = Source(source_type="academic_atlas", title="Historical Atlas")
    record.sources.append(source)

    assert record.slug == "abbasid-extent-132-143"
    assert record.spatial_precision == "approximate"
    assert record.publication_status == "reviewed"
    assert record.sources == [source]
    assert source.boundaries == [record]

    link = BoundarySource(
        boundary_id=uuid4(),
        source_id=uuid4(),
        citation_locator="map 8",
        support_type="geographic_cross_check",
        reliability_note="Macro-regional cross-check only.",
    )
    assert link.citation_locator == "map 8"


def test_boundary_geometry_and_database_constraints_are_declared() -> None:
    geometry_type = PoliticalBoundary.__table__.c.geometry.type
    assert isinstance(geometry_type, Geometry)
    assert geometry_type.geometry_type == "MULTIPOLYGON"
    assert geometry_type.srid == WGS84_SRID

    constraint_names = {
        constraint.name for constraint in PoliticalBoundary.__table__.constraints
    }
    assert {
        "ck_boundaries_confidence",
        "ck_boundaries_status",
        "ck_boundaries_spatial_precision",
        "ck_boundaries_geometry_nonempty",
        "ck_boundaries_geometry_valid",
        "ck_boundaries_geometry_srid",
        "uq_political_boundaries_slug",
    } <= constraint_names
    assert "ix_political_boundaries_state_id" in {
        index.name for index in PoliticalBoundary.__table__.indexes
    }


def test_boundary_publication_requires_complete_source_backed_record() -> None:
    record = boundary()

    with pytest.raises(PublicationValidationError, match="source"):
        publish_boundary(record)

    record.sources.append(Source(source_type="academic", title="Reference"))
    publish_boundary(record)

    assert record.publication_status == PublicationStatus.PUBLISHED.value


@pytest.mark.parametrize(
    ("field", "message"),
    [
        ("slug", "slug"),
        ("state_id", "state"),
        ("geometry", "geometry"),
        ("confidence_level", "confidence"),
        ("spatial_precision", "spatial precision"),
        ("notes", "notes"),
        ("methodology_notes", "methodology"),
        ("limitations_notes", "limitations"),
    ],
)
def test_boundary_publication_rejects_missing_required_metadata(
    field: str, message: str
) -> None:
    record = boundary()
    record.sources.append(Source(source_type="academic", title="Reference"))
    setattr(record, field, None)

    with pytest.raises(PublicationValidationError, match=message):
        publish_boundary(record)


def test_boundary_publication_rejects_backwards_or_non_hijri_period() -> None:
    backwards = boundary(start_year=144, end_year=143)
    backwards.sources.append(Source(source_type="academic", title="Reference"))
    with pytest.raises(PublicationValidationError, match="end year"):
        publish_boundary(backwards)

    non_hijri = boundary()
    non_hijri.sources.append(Source(source_type="academic", title="Reference"))
    non_hijri.valid_from_date.calendar = "gregorian"
    with pytest.raises(PublicationValidationError, match="Hijri"):
        publish_boundary(non_hijri)

    open_ended = boundary()
    open_ended.sources.append(Source(source_type="academic", title="Reference"))
    open_ended.valid_to_date = None
    with pytest.raises(PublicationValidationError, match="valid-from and valid-to"):
        publish_boundary(open_ended)


def test_boundary_provenance_migration_is_reversible() -> None:
    versions = Path(__file__).parents[1] / "alembic" / "versions"
    migration_files = list(versions.glob("*_add_boundary_provenance.py"))
    assert len(migration_files) == 1

    migration = migration_files[0].read_text(encoding="utf-8")
    assert 'down_revision: str = "c833db6623d1"' in migration
    assert '"boundary_sources"' in migration
    assert '"publication_status"' in migration
    assert '"spatial_precision"' in migration
    assert '"ix_political_boundaries_state_id"' in migration
    assert 'op.drop_table("boundary_sources")' in migration
