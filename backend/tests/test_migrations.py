"""Alembic migration validation that does not require a local database server."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parents[1]
POSTGIS_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/abbasid_timemap"


def migration_environment() -> dict[str, str]:
    return {**os.environ, "DATABASE_URL": POSTGIS_DATABASE_URL}


def test_alembic_offline_upgrade_emits_postgis_and_core_tables() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head", "--sql"],
        cwd=BACKEND_DIR,
        check=False,
        capture_output=True,
        text=True,
        env=migration_environment(),
    )

    assert result.returncode == 0, result.stderr
    assert "CREATE EXTENSION IF NOT EXISTS postgis" in result.stdout
    assert "CREATE TABLE historical_events" in result.stdout
    assert "CREATE INDEX ix_places_point_gist" in result.stdout


def test_alembic_offline_downgrade_emits_schema_removal() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "downgrade", "c833db6623d1:base", "--sql"],
        cwd=BACKEND_DIR,
        check=False,
        capture_output=True,
        text=True,
        env=migration_environment(),
    )

    assert result.returncode == 0, result.stderr
    assert "DROP TABLE event_sources" in result.stdout
    assert "DROP EXTENSION IF EXISTS postgis" in result.stdout
