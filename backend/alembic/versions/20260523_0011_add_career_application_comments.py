"""add career application comments

Revision ID: 20260523_0011
Revises: 20260523_0010
Create Date: 2026-05-23
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260523_0011"
down_revision: str | Sequence[str] | None = "20260523_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS career_application_comments (
            id UUID PRIMARY KEY,
            career_application_id UUID NOT NULL
                REFERENCES career_applications(id) ON DELETE CASCADE,
            admin_user_id UUID
                REFERENCES admin_users(id) ON DELETE SET NULL,
            comment TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_career_application_comments_application_id
            ON career_application_comments (career_application_id)
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS ix_career_application_comments_application_id
        """
    )
    op.execute(
        """
        DROP TABLE IF EXISTS career_application_comments
        """
    )
