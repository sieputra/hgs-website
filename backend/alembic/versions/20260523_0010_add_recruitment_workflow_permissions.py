"""add recruitment workflow permissions to admin role

Revision ID: 20260523_0010
Revises: 20260523_0009
Create Date: 2026-05-23
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260523_0010"
down_revision: str | Sequence[str] | None = "20260523_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


RECRUITMENT_PERMISSIONS = """
[
    "recruitment.read",
    "recruitment.update"
]
"""


def upgrade() -> None:
    op.execute(
        f"""
        UPDATE admin_roles
        SET
            permissions = (
                SELECT jsonb_agg(permission ORDER BY permission)
                FROM (
                    SELECT DISTINCT permission
                    FROM jsonb_array_elements_text(
                        permissions || '{RECRUITMENT_PERMISSIONS}'::jsonb
                    ) AS source(permission)
                ) AS distinct_permissions
            ),
            updated_at = now()
        WHERE code = 'admin'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE admin_roles
        SET
            permissions = permissions
                - 'recruitment.read'
                - 'recruitment.update',
            updated_at = now()
        WHERE code = 'admin'
        """
    )
