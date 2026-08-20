from app.seeds.corpus_loader import build_manifest, load_corpus


def active_slugs(year: int) -> set[str]:
    corpus = load_corpus()
    return {
        event.slug
        for event in corpus.events
        if event.publication_status == "published"
        and event.start_date.year <= year <= (event.end_date.year if event.end_date else event.start_date.year)
    }


def test_representative_years_have_expected_corpus_events():
    assert "battle-of-the-great-zab" in active_slugs(132)
    assert {"death-of-al-saffah", "accession-of-al-mansur"} <= active_slugs(136)
    assert {
        "founding-of-baghdad",
        "revolt-of-muhammad-al-nafs-al-zakiyya",
        "revolt-of-ibrahim-ibn-abdallah",
    } <= active_slugs(145)
    assert {"death-of-al-mansur", "accession-of-al-mahdi"} <= active_slugs(158)
    assert {"death-of-al-hadi", "accession-of-harun-al-rashid"} <= active_slugs(170)


def test_non_spatial_events_remain_in_timeline_counts():
    corpus = load_corpus()
    manifest = build_manifest(corpus)

    assert "battle-of-the-great-zab" in active_slugs(132)
    assert "battle-of-the-great-zab" in manifest.non_spatial_events
    assert manifest.events_by_year[132] == len(active_slugs(132))


def test_founding_of_baghdad_is_active_only_in_145_ah():
    assert "founding-of-baghdad" not in active_slugs(144)
    assert "founding-of-baghdad" in active_slugs(145)
    assert "founding-of-baghdad" not in active_slugs(146)
