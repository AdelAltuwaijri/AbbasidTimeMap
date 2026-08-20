"""Explicit M-01 corpus command; never imported by application startup."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Sequence

from app.db.session import get_session_factory
from app.seeds.corpus_importer import import_corpus
from app.seeds.corpus_loader import CorpusValidationError, build_manifest, load_corpus


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate or import the 132-170 AH corpus")
    parser.add_argument("--validate-only", action="store_true", help="validate without writes")
    parser.add_argument("--manifest", action="store_true", help="include the deterministic manifest")
    args = parser.parse_args(argv)

    try:
        corpus = load_corpus()
        manifest = build_manifest(corpus)
        if args.validate_only:
            result: dict[str, object] = {
                "status": "valid",
                "counts": manifest.counts.model_dump(),
            }
        else:
            with get_session_factory()() as session:
                result = {"status": "imported", "counts": import_corpus(session, corpus)}
        if args.manifest:
            result["manifest"] = manifest.model_dump(mode="json")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except CorpusValidationError as error:
        print(f"Corpus validation failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
