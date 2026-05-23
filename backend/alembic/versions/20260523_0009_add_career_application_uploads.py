"""add career application upload paths

Revision ID: 20260523_0009
Revises: 20260523_0008
Create Date: 2026-05-23
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260523_0009"
down_revision: str | Sequence[str] | None = "20260523_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE career_applications
            ADD COLUMN IF NOT EXISTS self_photo_url VARCHAR(255),
            ADD COLUMN IF NOT EXISTS cv_file_url VARCHAR(255)
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE career_applications
            DROP COLUMN IF EXISTS cv_file_url,
            DROP COLUMN IF EXISTS self_photo_url
        """
    )
