"""Validated public historical-search endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.schemas.search import SearchResponse
from app.services.search import search_historical_entities
from app.services.search_normalization import (
    count_visible_search_characters,
    normalize_search_text,
)

router = APIRouter(prefix="/search", tags=["search"])


class _SearchParameters(BaseModel):
    model_config = ConfigDict(extra="forbid")

    q: str = Field(description="2-100 normalized visible characters")
    limit: int = Field(default=10, ge=1, le=20)

    @field_validator("q", mode="before")
    @classmethod
    def trim_query(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("q")
    @classmethod
    def require_visible_normalized_query(cls, value: str) -> str:
        visible_length = count_visible_search_characters(
            normalize_search_text(value)
        )
        if not 2 <= visible_length <= 100:
            raise ValueError("query must contain 2-100 normalized visible characters")
        return value


@router.get("", response_model=SearchResponse)
def historical_search(
    parameters: Annotated[_SearchParameters, Query()],
    session: Annotated[Session, Depends(get_session)],
) -> SearchResponse:
    return search_historical_entities(
        session, query=parameters.q, limit=parameters.limit
    )
