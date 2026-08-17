"""SQLAlchemy engine and request-session dependencies."""

from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import database_url


@lru_cache
def get_engine() -> Engine:
    """Build the lazily-created Postgres/PostGIS engine from DATABASE_URL."""
    return create_engine(database_url(), pool_pre_ping=True)


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    """Return the shared session factory."""
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session and always close it."""
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()
