"""Published historical-event endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.schemas.events import EventDetail
from app.services.events import get_published_event_detail

router = APIRouter(prefix="/events", tags=["events"])


@router.get(
    "/{slug}",
    response_model=EventDetail,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": (
                "Unknown, non-public, unsourced, or confidence-unclassified event"
            )
        }
    },
)
def event_detail(
    slug: str, session: Annotated[Session, Depends(get_session)]
) -> EventDetail:
    detail = get_published_event_detail(session, slug)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return detail
