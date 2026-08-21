from app.seeds.boundary_loader import build_boundary_manifest, load_boundary_package


def test_m02_manifest_has_three_distinct_reviewed_periods() -> None:
    package = load_boundary_package()
    manifest = build_boundary_manifest(package)

    assert manifest.counts.boundaries == 3
    assert manifest.counts.states == 1
    assert [
        (period.slug, period.valid_from_hijri, period.valid_to_hijri)
        for period in manifest.periods
    ] == [
        ("abbasid-extent-132-143", 132, 143),
        ("abbasid-extent-144-154", 144, 154),
        ("abbasid-extent-155-170", 155, 170),
    ]
    assert manifest.by_confidence == {"medium": 3}
    assert manifest.by_spatial_precision == {"approximate": 3}
    assert 30 <= manifest.total_vertices <= 250


def test_reconstructions_change_only_on_evidence_triggered_years() -> None:
    package = load_boundary_package()
    features = package.boundaries.features

    assert len({repr(feature.geometry.coordinates) for feature in features}) == 3
    assert all(feature.properties.state_slug == "abbasid-caliphate" for feature in features)
    assert all(feature.properties.publication_status == "published" for feature in features)
    assert all(feature.properties.sources for feature in features)
    assert all(feature.properties.anchors for feature in features)
    assert all(feature.properties.exclusions for feature in features)


def test_each_record_discloses_approximation_and_dec014_exclusions() -> None:
    package = load_boundary_package()
    forbidden_keys = {"modern_country", "admin_0", "admin_1", "modern_border"}

    for feature in package.boundaries.features:
        properties = feature.properties
        assert "تقريب" in properties.reconstruction_notes_ar
        assert "حد" in properties.reconstruction_notes_ar
        assert "الأندلس" in properties.exclusions
        assert forbidden_keys.isdisjoint(properties.model_fields_set)
