from app.seeds.corpus_loader import build_manifest, load_corpus


def test_m01_manifest_matches_target_counts_and_required_years():
    manifest = build_manifest(load_corpus())

    assert manifest.counts.model_dump() == {
        "events": 42,
        "people": 20,
        "places": 20,
        "states": 4,
        "sources": 16,
        "event_types": 11,
    }
    assert {year: manifest.events_by_year[year] for year in (132, 136, 145, 158, 170)} == {
        132: 6,
        136: 3,
        145: 5,
        158: 4,
        170: 4,
    }
    assert manifest.events_by_type["battle"] == 7
    assert manifest.events_by_type["revolt"] == 9


def test_f05_record_and_historically_neutral_scope_remain_intact():
    corpus = load_corpus()
    events = {event.slug: event for event in corpus.events}
    places = {place.slug: place for place in corpus.places}

    baghdad = events["founding-of-baghdad"]
    assert baghdad.start_date.year == 145
    assert baghdad.primary_place == "baghdad"
    assert baghdad.geometry == (44.3661, 33.3152)
    assert {link.source for link in baghdad.sources} >= {"iranica-baghdad"}
    assert places["baghdad"].modern_reference
    assert all("boundary" not in event.event_type for event in corpus.events)
