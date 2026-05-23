"""add gallery management permissions

Revision ID: 20260523_0007
Revises: 20260523_0006
Create Date: 2026-05-23
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260523_0007"
down_revision: str | Sequence[str] | None = "20260523_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE admin_roles
        SET
            permissions = (
                SELECT jsonb_agg(permission ORDER BY permission)
                FROM (
                    SELECT DISTINCT permission
                    FROM jsonb_array_elements_text(
                        permissions || '["gallery.update", "gallery.delete"]'::jsonb
                    ) AS source(permission)
                ) AS distinct_permissions
            ),
            updated_at = now()
        WHERE code IN ('admin', 'content_admin')
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE admin_roles
        SET
            permissions = permissions - 'gallery.update' - 'gallery.delete',
            updated_at = now()
        WHERE code IN ('admin', 'content_admin')
        """
    )
