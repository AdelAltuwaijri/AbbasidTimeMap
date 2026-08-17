"""Create the F-02 historical data model with PostGIS geometry support."""

from typing import Sequence, Union

import sqlalchemy as sa
from geoalchemy2 import Geometry

from alembic import op

revision: str = "c833db6623d1"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _uuid() -> sa.UUID:
    return sa.UUID()


def upgrade() -> None:
    """Create curated-history tables and PostGIS indexes."""
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    uuid = _uuid()
    op.create_table(
        "historical_dates",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("calendar", sa.String(32), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer()),
        sa.Column("day", sa.Integer()),
        sa.Column("precision", sa.String(32), nullable=False),
        sa.Column("circa", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("display_label_ar", sa.Text()),
        sa.Column("display_label_en", sa.Text()),
        sa.CheckConstraint(
            "calendar IN ('hijri', 'gregorian', 'mixed_reference')", name="ck_dates_calendar"
        ),
        sa.CheckConstraint(
            "precision IN ('exact', 'month', 'year', 'approximate', 'disputed')",
            name="ck_dates_precision",
        ),
        sa.CheckConstraint("month IS NULL OR month BETWEEN 1 AND 12", name="ck_dates_month"),
        sa.CheckConstraint("day IS NULL OR day BETWEEN 1 AND 31", name="ck_dates_day"),
    )
    op.create_index("ix_historical_dates_year", "historical_dates", ["year"])
    op.create_table(
        "event_types",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("code", sa.String(64), nullable=False, unique=True),
        sa.Column("name_ar", sa.String(255), nullable=False),
        sa.Column("name_en", sa.String(255), nullable=False),
        sa.Column("icon_key", sa.String(128)),
    )
    op.create_table(
        "places",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("name_ar", sa.String(500), nullable=False),
        sa.Column("name_en", sa.String(500)),
        sa.Column("place_type", sa.String(64), nullable=False),
        sa.Column("point", Geometry("POINT", srid=4326, spatial_index=False)),
        sa.Column("area", Geometry("MULTIPOLYGON", srid=4326, spatial_index=False)),
        sa.Column("modern_reference", sa.String(500)),
    )
    op.create_index("ix_places_point_gist", "places", ["point"], postgresql_using="gist")
    op.create_index("ix_places_area_gist", "places", ["area"], postgresql_using="gist")
    op.create_table(
        "people",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("canonical_name_ar", sa.String(500), nullable=False),
        sa.Column("canonical_name_en", sa.String(500)),
        sa.Column("aliases", sa.Text()),
        sa.Column("birth_date_id", uuid, sa.ForeignKey("historical_dates.id")),
        sa.Column("death_date_id", uuid, sa.ForeignKey("historical_dates.id")),
        sa.Column("biography_ar", sa.Text()),
        sa.Column("biography_en", sa.Text()),
        sa.Column("confidence_level", sa.String(32)),
    )
    op.create_table(
        "states",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("name_ar", sa.String(500), nullable=False),
        sa.Column("name_en", sa.String(500)),
        sa.Column("state_type", sa.String(64), nullable=False),
        sa.Column("start_date_id", uuid, sa.ForeignKey("historical_dates.id")),
        sa.Column("end_date_id", uuid, sa.ForeignKey("historical_dates.id")),
        sa.Column("relation_to_abbasid", sa.String(128)),
    )
    op.create_table(
        "sources",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("source_type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("author", sa.String(500)),
        sa.Column("edition", sa.String(500)),
        sa.Column("publication_data", sa.Text()),
        sa.Column("url", sa.Text()),
        sa.Column("notes", sa.Text()),
    )
    op.create_table(
        "historical_events",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("title_ar", sa.String(500), nullable=False),
        sa.Column("title_en", sa.String(500)),
        sa.Column("event_type_id", uuid, sa.ForeignKey("event_types.id")),
        sa.Column("start_date_id", uuid, sa.ForeignKey("historical_dates.id"), nullable=False),
        sa.Column("end_date_id", uuid, sa.ForeignKey("historical_dates.id")),
        sa.Column("primary_place_id", uuid, sa.ForeignKey("places.id")),
        sa.Column("summary_ar", sa.Text()),
        sa.Column("summary_en", sa.Text()),
        sa.Column("causes_ar", sa.Text()),
        sa.Column("consequences_ar", sa.Text()),
        sa.Column("importance", sa.SmallInteger()),
        sa.Column("confidence_level", sa.String(32)),
        sa.Column("publication_status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("primary_geometry", Geometry("GEOMETRY", srid=4326, spatial_index=False)),
        sa.Column("editorial_notes", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("importance BETWEEN 1 AND 5", name="ck_events_importance"),
        sa.CheckConstraint(
            "publication_status IN ('draft', 'reviewed', 'published', 'archived')",
            name="ck_events_status",
        ),
    )
    op.create_index(
        "ix_historical_events_primary_geometry_gist",
        "historical_events",
        ["primary_geometry"],
        postgresql_using="gist",
    )
    op.create_table(
        "political_boundaries",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("state_id", uuid, sa.ForeignKey("states.id"), nullable=False),
        sa.Column("valid_from_date_id", uuid, sa.ForeignKey("historical_dates.id"), nullable=False),
        sa.Column("valid_to_date_id", uuid, sa.ForeignKey("historical_dates.id")),
        sa.Column(
            "geometry", Geometry("MULTIPOLYGON", srid=4326, spatial_index=False), nullable=False
        ),
        sa.Column("confidence_level", sa.String(32), nullable=False),
        sa.Column("notes", sa.Text()),
    )
    op.create_index(
        "ix_political_boundaries_geometry_gist",
        "political_boundaries",
        ["geometry"],
        postgresql_using="gist",
    )
    op.create_table(
        "event_people",
        sa.Column(
            "event_id",
            uuid,
            sa.ForeignKey("historical_events.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "person_id", uuid, sa.ForeignKey("people.id", ondelete="CASCADE"), primary_key=True
        ),
        sa.Column("role_code", sa.String(64), primary_key=True, nullable=False, server_default=""),
    )
    op.create_table(
        "event_places",
        sa.Column(
            "event_id",
            uuid,
            sa.ForeignKey("historical_events.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "place_id", uuid, sa.ForeignKey("places.id", ondelete="CASCADE"), primary_key=True
        ),
        sa.Column("relation_type", sa.String(64), primary_key=True),
    )
    op.create_table(
        "event_states",
        sa.Column(
            "event_id",
            uuid,
            sa.ForeignKey("historical_events.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "state_id", uuid, sa.ForeignKey("states.id", ondelete="CASCADE"), primary_key=True
        ),
        sa.Column("relation_type", sa.String(64), primary_key=True),
    )
    op.create_table(
        "event_sources",
        sa.Column(
            "event_id",
            uuid,
            sa.ForeignKey("historical_events.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "source_id", uuid, sa.ForeignKey("sources.id", ondelete="CASCADE"), primary_key=True
        ),
        sa.Column("citation_locator", sa.Text()),
        sa.Column("support_type", sa.String(64), nullable=False),
        sa.Column("reliability_note", sa.Text()),
    )


def downgrade() -> None:
    """Remove F-02 tables and the local PostGIS extension."""
    for table in (
        "event_sources",
        "event_states",
        "event_places",
        "event_people",
        "political_boundaries",
        "historical_events",
        "sources",
        "states",
        "people",
        "places",
        "event_types",
    ):
        op.drop_table(table)
    op.drop_index("ix_historical_dates_year", table_name="historical_dates")
    op.drop_table("historical_dates")
    op.execute("DROP EXTENSION IF EXISTS postgis")
