"""Map-facing GeoJSON endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.schemas.map import EventFeatureCollection
from app.services.geography import get_event_feature_collection

router = APIRouter(prefix="/map", tags=["map"])


@router.get("/events", response_model=EventFeatureCollection)
def list_event_markers(session: Annotated[Session, Depends(get_session)]) -> EventFeatureCollection:
    """Return published event markers as a GeoJSON FeatureCollection."""

    return get_event_feature_collection(session)
