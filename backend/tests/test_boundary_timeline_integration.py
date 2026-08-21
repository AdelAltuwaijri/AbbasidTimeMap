import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.seeds.boundary_importer import import_boundary_package
from app.seeds.boundary_loader import load_boundary_package
from app.services.timeline import get_timeline_state

DATABASE_URL = os.getenv("M02_INTEGRATION_DATABASE_URL")


@pytest.mark.skipif(not DATABASE_URL, reason="requires M02_INTEGRATION_DATABASE_URL")
def test_timeline_switches_published_boundary_at_inclusive_period_edges() -> None:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    package = load_boundary_package()
    expected_by_year: dict[int, str] = {}
    for feature in package.boundaries.features:
        properties = feature.properties
        for year in range(properties.valid_from.year, properties.valid_to.year + 1):
            expected_by_year[year] = properties.slug

    with Session(engine) as session:
        import_boundary_package(session, package)
        for year in (132, 143, 144, 154, 155, 170):
            state = get_timeline_state(session, year)
            abbasid = [
                feature
                for feature in state.boundaries.features
                if feature.properties.state_slug == "abbasid-caliphate"
            ]
            assert [feature.properties.boundary_slug for feature in abbasid] == [
                expected_by_year[year]
            ]
            feature = abbasid[0]
            assert feature.geometry.type == "MultiPolygon"
            assert feature.geometry.coordinates
            assert feature.properties.source_count > 0
            assert feature.properties.primary_source_title
            assert feature.properties.reconstruction_note_ar
            assert feature.properties.confidence == "medium"
            assert feature.properties.spatial_precision == "approximate"

        for year in (131, 171):
            state = get_timeline_state(session, year)
            assert not any(
                feature.properties.state_slug == "abbasid-caliphate"
                for feature in state.boundaries.features
            )
