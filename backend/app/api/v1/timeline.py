"""Timeline state endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.schemas.timeline import TimelineState
from app.services.timeline import get_timeline_state

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("/state", response_model=TimelineState)
def timeline_state(
    year_hijri: Annotated[int, Query(ge=1, le=9999)],
    session: Annotated[Session, Depends(get_session)],
) -> TimelineState:
    return get_timeline_state(session, year_hijri)
