"""Conservative Arabic normalization for historical-name matching only."""

from __future__ import annotations

import re
import unicodedata

from sqlalchemy import func, literal_column
from sqlalchemy.sql.elements import ColumnElement

_ARABIC_MARKS = re.compile("[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]")
_SQL_ARABIC_MARKS_PATTERN = "[ؐ-ًؚ-ٰٟۖ-ۭ]"
_WHITESPACE = re.compile(r"\s+")
_INVISIBLE_FORMAT_CONTROLS = (
    "\u00ad\u061c\u180e\u200b\u200c\u200d\u200e\u200f"
    "\u202a\u202b\u202c\u202d\u202e"
    "\u2060\u2061\u2062\u2063\u2064\u2066\u2067\u2068\u2069\ufeff"
)
_TRANSLATION = str.maketrans(
    {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ٱ": "ا",
        "ى": "ي",
        "ـ": None,
        **dict.fromkeys(_INVISIBLE_FORMAT_CONTROLS),
    }
)


def normalize_search_text(value: str) -> str:
    """Return the approved match-only form without changing display text."""

    normalized = unicodedata.normalize("NFKC", value).lower().translate(_TRANSLATION)
    normalized = _ARABIC_MARKS.sub("", normalized)
    return _WHITESPACE.sub(" ", normalized).strip()


def count_visible_search_characters(value: str) -> int:
    """Count base characters, excluding marks, separators, and control formatting."""

    return sum(
        1
        for character in value
        if unicodedata.category(character)[0] not in {"C", "M", "Z"}
    )


def normalize_search_expression(expression: ColumnElement[str]) -> ColumnElement[str]:
    """Build the PostgreSQL equivalent for a curated text column."""

    compatibility_normalized = func.normalize(
        func.coalesce(expression, ""), literal_column("NFKC")
    )
    without_format_controls = func.translate(
        func.lower(compatibility_normalized), _INVISIBLE_FORMAT_CONTROLS, ""
    )
    translated = func.translate(
        without_format_controls, "أإآٱىـ", "ااااي"
    )
    without_marks = func.regexp_replace(
        translated, _SQL_ARABIC_MARKS_PATTERN, "", "g"
    )
    return func.btrim(func.regexp_replace(without_marks, "[[:space:]]+", " ", "g"))


def escape_like_pattern(value: str, escape: str = "\\") -> str:
    """Escape PostgreSQL LIKE metacharacters in a user-supplied match value."""

    return value.replace(escape, escape * 2).replace("%", f"{escape}%").replace(
        "_", f"{escape}_"
    )
