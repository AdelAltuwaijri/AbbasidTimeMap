import json

from app.seeds.historical_boundaries import main


def test_validate_only_command_reports_exact_counts(capsys) -> None:
    assert main(["--validate-only"]) == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload == {
        "status": "valid",
        "counts": {"boundaries": 3, "sources": payload["counts"]["sources"], "states": 1},
    }


def test_manifest_command_is_reproducible(capsys) -> None:
    assert main(["--validate-only", "--manifest"]) == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["manifest"]["periods"] == [
        {
            "slug": "abbasid-extent-132-143",
            "state_slug": "abbasid-caliphate",
            "valid_from_hijri": 132,
            "valid_to_hijri": 143,
        },
        {
            "slug": "abbasid-extent-144-154",
            "state_slug": "abbasid-caliphate",
            "valid_from_hijri": 144,
            "valid_to_hijri": 154,
        },
        {
            "slug": "abbasid-extent-155-170",
            "state_slug": "abbasid-caliphate",
            "valid_from_hijri": 155,
            "valid_to_hijri": 170,
        },
    ]
