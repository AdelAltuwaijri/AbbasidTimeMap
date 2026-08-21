"""Add auditable provenance and publication controls to political boundaries."""

import sqlalchemy as sa

from alembic import op

revision: str = "f4b7a9c2d105"
down_revision: str = "c833db6623d1"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Add stable identity, uncertainty metadata, provenance, and safeguards."""

    op.add_column(
        "political_boundaries", sa.Column("slug", sa.String(255), nullable=True)
    )
    op.execute(
        "UPDATE political_boundaries "
        "SET slug = 'boundary-' || id::text "
        "WHERE slug IS NULL"
    )
    op.alter_column("political_boundaries", "slug", nullable=False)
    op.add_column(
        "political_boundaries",
        sa.Column(
            "publication_status",
            sa.String(32),
            nullable=False,
            server_default="draft",
        ),
    )
    op.add_column(
        "political_boundaries",
        sa.Column(
            "spatial_precision",
            sa.String(32),
            nullable=False,
            server_default="approximate",
        ),
    )
    op.add_column(
        "political_boundaries", sa.Column("methodology_notes", sa.Text())
    )
    op.add_column(
        "political_boundaries", sa.Column("limitations_notes", sa.Text())
    )
    op.add_column(
        "political_boundaries", sa.Column("overlap_justification", sa.Text())
    )

    op.create_unique_constraint(
        "uq_political_boundaries_slug", "political_boundaries", ["slug"]
    )
    op.create_check_constraint(
        "ck_boundaries_confidence",
        "political_boundaries",
        "confidence_level IN ('high', 'medium', 'approximate', 'disputed')",
    )
    op.create_check_constraint(
        "ck_boundaries_status",
        "political_boundaries",
        "publication_status IN ('draft', 'reviewed', 'published', 'archived')",
    )
    op.create_check_constraint(
        "ck_boundaries_spatial_precision",
        "political_boundaries",
        "spatial_precision IN ('exact', 'approximate', 'disputed')",
    )
    op.create_check_constraint(
        "ck_boundaries_geometry_nonempty",
        "political_boundaries",
        "NOT ST_IsEmpty(geometry)",
    )
    op.create_check_constraint(
        "ck_boundaries_geometry_valid",
        "political_boundaries",
        "ST_IsValid(geometry)",
    )
    op.create_check_constraint(
        "ck_boundaries_geometry_srid",
        "political_boundaries",
        "ST_SRID(geometry) = 4326",
    )
    op.create_index(
        "ix_political_boundaries_state_id", "political_boundaries", ["state_id"]
    )

    op.create_table(
        "boundary_sources",
        sa.Column(
            "boundary_id",
            sa.UUID(),
            sa.ForeignKey("political_boundaries.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "source_id",
            sa.UUID(),
            sa.ForeignKey("sources.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("citation_locator", sa.Text()),
        sa.Column("support_type", sa.String(64), nullable=False),
        sa.Column("reliability_note", sa.Text()),
    )


def downgrade() -> None:
    """Remove M-02 boundary provenance and publication controls."""

    op.drop_table("boundary_sources")
    op.drop_index(
        "ix_political_boundaries_state_id", table_name="political_boundaries"
    )
    for constraint_name in (
        "ck_boundaries_geometry_srid",
        "ck_boundaries_geometry_valid",
        "ck_boundaries_geometry_nonempty",
        "ck_boundaries_spatial_precision",
        "ck_boundaries_status",
        "ck_boundaries_confidence",
        "uq_political_boundaries_slug",
    ):
        op.drop_constraint(
            constraint_name, "political_boundaries", type_="unique"
            if constraint_name == "uq_political_boundaries_slug"
            else "check"
        )
    for column_name in (
        "overlap_justification",
        "limitations_notes",
        "methodology_notes",
        "spatial_precision",
        "publication_status",
        "slug",
    ):
        op.drop_column("political_boundaries", column_name)
