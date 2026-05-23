"""add content management permissions

Revision ID: 20260523_0006
Revises: 20260522_0005
Create Date: 2026-05-23
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260523_0006"
down_revision: str | Sequence[str] | None = "20260522_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE admin_roles
        SET
            permissions = '[
                "role.read",
                "role.create",
                "role.update",
                "role.delete",
                "user.read",
                "user.create",
                "user.update",
                "user.delete",
                "service.read",
                "service.create",
                "service.update",
                "service.delete",
                "faq.read",
                "faq.create",
                "faq.update",
                "faq.delete",
                "gallery.read",
                "gallery.create"
            ]'::jsonb,
            updated_at = now()
        WHERE code = 'admin'
        """
    )
    op.execute(
        """
        UPDATE admin_roles
        SET
            permissions = '[
                "service.read",
                "service.create",
                "service.update",
                "service.delete",
                "faq.read",
                "faq.create",
                "faq.update",
                "faq.delete",
                "gallery.read",
                "gallery.create"
            ]'::jsonb,
            updated_at = now()
        WHERE code = 'content_admin'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE admin_roles
        SET
            permissions = '[
                "role.read",
                "role.create",
                "role.update",
                "role.delete",
                "user.read",
                "user.create",
                "user.update",
                "user.delete",
                "gallery.read",
                "gallery.create"
            ]'::jsonb,
            updated_at = now()
        WHERE code = 'admin'
        """
    )
    op.execute(
        """
        UPDATE admin_roles
        SET
            permissions = '["gallery.read", "gallery.create"]'::jsonb,
            updated_at = now()
        WHERE code = 'content_admin'
        """
    )
