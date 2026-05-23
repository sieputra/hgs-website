"""add human resources management permissions

Revision ID: 20260523_0008
Revises: 20260523_0007
Create Date: 2026-05-23
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260523_0008"
down_revision: str | Sequence[str] | None = "20260523_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


HR_PERMISSIONS = """
[
    "division.read",
    "division.create",
    "division.update",
    "division.delete",
    "position.read",
    "position.create",
    "position.update",
    "position.delete",
    "job.read",
    "job.create",
    "job.update",
    "job.delete"
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
                        permissions || '{HR_PERMISSIONS}'::jsonb
                    ) AS source(permission)
                ) AS distinct_permissions
            ),
            updated_at = now()
        WHERE code = 'admin'
        """
    )
    op.execute(
        f"""
        UPDATE admin_roles
        SET
            permissions = (
                SELECT jsonb_agg(permission ORDER BY permission)
                FROM (
                    SELECT DISTINCT permission
                    FROM jsonb_array_elements_text(
                        permissions || '{HR_PERMISSIONS}'::jsonb
                    ) AS source(permission)
                ) AS distinct_permissions
            ),
            description = 'Can manage recruitment master data and job postings.',
            updated_at = now()
        WHERE code = 'recruitment_admin'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE admin_roles
        SET
            permissions = permissions
                - 'division.read'
                - 'division.create'
                - 'division.update'
                - 'division.delete'
                - 'position.read'
                - 'position.create'
                - 'position.update'
                - 'position.delete'
                - 'job.read'
                - 'job.create'
                - 'job.update'
                - 'job.delete',
            updated_at = now()
        WHERE code IN ('admin', 'recruitment_admin')
        """
    )
