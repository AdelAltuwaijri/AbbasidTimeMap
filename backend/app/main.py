"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.events import router as events_router
from app.api.v1.health import health_check
from app.api.v1.health import router as health_router
from app.api.v1.map import router as map_router
from app.api.v1.timeline import router as timeline_router
from app.core.config import cors_origins

app = FastAPI(title="Abbasid TimeMap API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(health_router, prefix="/api/v1")
app.include_router(events_router, prefix="/api/v1")
app.include_router(map_router, prefix="/api/v1")
app.include_router(timeline_router, prefix="/api/v1")
app.add_api_route("/health", health_check, methods=["GET"], tags=["health"])
