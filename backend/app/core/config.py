"""Configuration sourced from environment variables."""

from __future__ import annotations

import os


def database_url() -> str:
    """Return the PostgreSQL/PostGIS connection URL configured for this environment."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/abbasid_timemap",
    )


def cors_origins() -> list[str]:
    """Return configured browser origins, defaulting to the local frontend."""
    value = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in value.split(",") if origin.strip()]
