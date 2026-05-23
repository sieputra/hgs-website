"""add admin users and rbac roles

Revision ID: 20260522_0005
Revises: 20260522_0004
Create Date: 2026-05-22
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260522_0005"
down_revision: str | Sequence[str] | None = "20260522_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(80) NOT NULL UNIQUE,
            name VARCHAR(120) NOT NULL,
            description TEXT,
            permissions JSONB NOT NULL,
            is_system BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        INSERT INTO admin_roles (code, name, description, permissions, is_system)
        VALUES
            (
                'super_admin',
                'Super Admin',
                'Full access to every admin function.',
                '["*"]'::jsonb,
                true
            ),
            (
                'admin',
                'Admin',
                'Can manage users and operational admin content.',
                '[
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
                true
            ),
            (
                'content_admin',
                'Content Admin',
                'Can manage public website content.',
                '["gallery.read", "gallery.create"]'::jsonb,
                true
            ),
            (
                'recruitment_admin',
                'Recruitment Admin',
                'Can manage future recruitment workflows.',
                '["recruitment.read", "recruitment.update"]'::jsonb,
                true
            )
        ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            permissions = EXCLUDED.permissions,
            is_system = EXCLUDED.is_system,
            updated_at = now()
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
            email VARCHAR(150) NOT NULL UNIQUE,
            full_name VARCHAR(150) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            last_login_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_admin_users_role_id
        ON admin_users(role_id)
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS admin_users")
    op.execute("DROP TABLE IF EXISTS admin_roles")
