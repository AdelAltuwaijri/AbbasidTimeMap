import json

from app.seeds import early_abbasid_corpus
from app.seeds.corpus_loader import CorpusValidationError


def test_validate_only_command_reports_counts_and_manifest(capsys):
    assert early_abbasid_corpus.main(["--validate-only", "--manifest"]) == 0

    payload = json.loads(capsys.readouterr().out)
    assert payload["status"] == "valid"
    assert payload["counts"]["events"] == 42
    assert payload["manifest"]["events_by_year"]["145"] == 5


def test_command_reports_validation_failure_without_silent_skip(monkeypatch, capsys):
    def fail():
        raise CorpusValidationError("event bad is published without a source")

    monkeypatch.setattr(early_abbasid_corpus, "load_corpus", fail)

    assert early_abbasid_corpus.main(["--validate-only"]) == 1
    captured = capsys.readouterr()
    assert captured.out == ""
    assert "published without a source" in captured.err
