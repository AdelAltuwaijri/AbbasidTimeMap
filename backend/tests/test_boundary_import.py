import os

import pytest
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.orm import Session

from app.models.historical import BoundarySource, PoliticalBoundary, Source
from app.seeds.boundary_importer import import_boundary_package
from app.seeds.boundary_loader import BoundaryValidationError, load_boundary_package

DATABASE_URL = os.getenv("M02_INTEGRATION_DATABASE_URL")


@pytest.mark.skipif(not DATABASE_URL, reason="requires M02_INTEGRATION_DATABASE_URL")
def test_import_is_atomic_idempotent_and_geometrically_valid() -> None:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    package = load_boundary_package()
    slugs = {feature.properties.slug for feature in package.boundaries.features}

    with Session(engine) as session:
        source_count_before = session.scalar(select(func.count()).select_from(Source)) or 0
        first = import_boundary_package(session, package)
        first_ids = dict(
            session.execute(
                select(PoliticalBoundary.slug, PoliticalBoundary.id).where(
                    PoliticalBoundary.slug.in_(slugs)
                )
            ).all()
        )
        first_source_count = session.scalar(select(func.count()).select_from(Source)) or 0
        first_source_ids = dict(
            session.execute(
                select(Source.title, Source.id).where(
                    Source.id.in_(
                        select(BoundarySource.source_id).where(
                            BoundarySource.boundary_id.in_(first_ids.values())
                        )
                    )
                )
            ).all()
        )
        first_link_count = session.scalar(
            select(func.count())
            .select_from(BoundarySource)
            .where(BoundarySource.boundary_id.in_(first_ids.values()))
        ) or 0

        second = import_boundary_package(session, package)
        second_ids = dict(
            session.execute(
                select(PoliticalBoundary.slug, PoliticalBoundary.id).where(
                    PoliticalBoundary.slug.in_(slugs)
                )
            ).all()
        )
        second_source_count = session.scalar(select(func.count()).select_from(Source)) or 0
        second_source_ids = dict(
            session.execute(
                select(Source.title, Source.id).where(
                    Source.id.in_(
                        select(BoundarySource.source_id).where(
                            BoundarySource.boundary_id.in_(second_ids.values())
                        )
                    )
                )
            ).all()
        )
        second_link_count = session.scalar(
            select(func.count())
            .select_from(BoundarySource)
            .where(BoundarySource.boundary_id.in_(second_ids.values()))
        ) or 0
        invalid_geometry_count = session.scalar(
            text(
                "SELECT count(*) FROM political_boundaries "
                "WHERE slug = ANY(:slugs) AND "
                "(NOT ST_IsValid(geometry) OR ST_IsEmpty(geometry) OR ST_SRID(geometry) <> 4326)"
            ),
            {"slugs": sorted(slugs)},
        )

    assert first == second == {"boundaries": 3, "sources": len(package.sources), "states": 1}
    assert first_ids == second_ids
    assert len(first_ids) == 3
    assert first_source_count == second_source_count
    assert first_source_ids == second_source_ids
    assert first_source_count >= source_count_before
    assert first_link_count == second_link_count >= 3
    assert invalid_geometry_count == 0


@pytest.mark.skipif(not DATABASE_URL, reason="requires M02_INTEGRATION_DATABASE_URL")
def test_invalid_package_is_rejected_without_boundary_changes() -> None:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    package = load_boundary_package().model_copy(deep=True)
    package.boundaries.features[0].properties.state_slug = "missing-state"

    with Session(engine) as session:
        before = session.scalar(select(func.count()).select_from(PoliticalBoundary)) or 0
        with pytest.raises(BoundaryValidationError, match="missing state"):
            import_boundary_package(session, package)
        after = session.scalar(select(func.count()).select_from(PoliticalBoundary)) or 0

    assert before == after
