"""Explicit M-02 boundary command; never imported by application startup."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Sequence

from app.db.session import get_session_factory
from app.seeds.boundary_importer import import_boundary_package
from app.seeds.boundary_loader import (
    BoundaryValidationError,
    build_boundary_manifest,
    load_boundary_package,
)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate or import the M-02 historical boundary package"
    )
    parser.add_argument("--validate-only", action="store_true", help="validate without writes")
    parser.add_argument("--manifest", action="store_true", help="include deterministic manifest")
    args = parser.parse_args(argv)

    try:
        package = load_boundary_package()
        manifest = build_boundary_manifest(package)
        if args.validate_only:
            result: dict[str, object] = {
                "status": "valid",
                "counts": manifest.counts.model_dump(),
            }
        else:
            with get_session_factory()() as session:
                result = {
                    "status": "imported",
                    "counts": import_boundary_package(session, package),
                }
        if args.manifest:
            result["manifest"] = manifest.model_dump(mode="json")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except BoundaryValidationError as error:
        print(f"Boundary validation failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
