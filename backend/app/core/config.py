"""Configuration sourced from environment variables."""

from __future__ import annotations

import os


def cors_origins() -> list[str]:
    """Return configured browser origins, defaulting to the local frontend."""
    value = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in value.split(",") if origin.strip()]
