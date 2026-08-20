from pathlib import Path


def test_f05_seed_is_explicit_idempotent_and_source_backed():
    seed = Path(__file__).parents[1] / "app" / "seeds" / "founding_of_baghdad.py"
    content = seed.read_text(encoding="utf-8")
    assert 'EVENT_SLUG = "founding-of-baghdad"' in content
    assert "def seed(session" in content
    assert "select(HistoricalEvent).where(HistoricalEvent.slug == EVENT_SLUG)" in content
    assert "EventSource" in content
    assert "publish_event(event)" in content
    assert "app.main" not in content
