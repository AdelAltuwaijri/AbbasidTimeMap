"""Conservative Arabic normalization shared by M-03 search projections."""

import pytest
from sqlalchemy import column
from sqlalchemy.dialects import postgresql

from app.services.search_normalization import (
    count_visible_search_characters,
    escape_like_pattern,
    normalize_search_expression,
    normalize_search_text,
)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("\ufefb", "لا"),
        ("أإآٱ", "اااا"),
        ("مَدِينَةٌ", "مدينة"),
        ("الـعِرَاق", "العراق"),
        ("فتى", "فتي"),
        ("  أبو\tمسلم\nالخراساني  ", "ابو مسلم الخراساني"),
        ("مكة", "مكة"),
        ("مسؤول شاطئ", "مسؤول شاطئ"),
        ("Straße", "straße"),
        ("\u200b\u200f\u2067\ufeff", ""),
    ],
)
def test_normalize_search_text_applies_only_the_approved_rules(
    value: str, expected: str
) -> None:
    assert normalize_search_text(value) == expected


def test_normalized_empty_input_stays_empty() -> None:
    assert normalize_search_text("ـَ ِ ُ\u200b\u200f") == ""


def test_visible_length_ignores_combining_and_format_characters() -> None:
    assert count_visible_search_characters("\u034f\ufe0f\u200b") == 0
    assert count_visible_search_characters("ا\u034f ب") == 2


def test_escape_like_pattern_treats_user_wildcards_as_literals() -> None:
    assert escape_like_pattern("100%_\\") == "100\\%\\_\\\\"


def test_sql_normalization_mirrors_arabic_and_whitespace_rules() -> None:
    sql = str(
        normalize_search_expression(column("title_ar")).compile(
            dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}
        )
    )

    assert "normalize" in sql
    assert "NFKC" in sql
    assert "translate" in sql
    assert "regexp_replace" in sql
    assert "أإآٱىـ" in sql
    assert "ااااي" in sql
    assert "[[:space:]]+" in sql
