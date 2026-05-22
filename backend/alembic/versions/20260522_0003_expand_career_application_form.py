"""expand career application form storage

Revision ID: 20260522_0003
Revises: 20260522_0002
Create Date: 2026-05-22
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260522_0003"
down_revision: str | Sequence[str] | None = "20260522_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE career_applications
            ADD COLUMN IF NOT EXISTS school_entry_year SMALLINT,
            ADD COLUMN IF NOT EXISTS school_graduation_year SMALLINT,
            ADD COLUMN IF NOT EXISTS school_address TEXT,
            ADD COLUMN IF NOT EXISTS grade_point_average VARCHAR(30),
            ADD COLUMN IF NOT EXISTS alternative_applied_position VARCHAR(100)
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS career_application_social_media_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            career_application_id UUID NOT NULL
                REFERENCES career_applications(id) ON DELETE CASCADE,
            platform VARCHAR(50) NOT NULL,
            account_id VARCHAR(150) NOT NULL,
            sort_order SMALLINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS career_application_family_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            career_application_id UUID NOT NULL
                REFERENCES career_applications(id) ON DELETE CASCADE,
            relationship VARCHAR(50) NOT NULL,
            name VARCHAR(150) NOT NULL,
            education_level VARCHAR(100),
            occupation VARCHAR(150),
            workplace VARCHAR(150),
            sort_order SMALLINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS career_application_organization_experiences (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            career_application_id UUID NOT NULL
                REFERENCES career_applications(id) ON DELETE CASCADE,
            organization_name VARCHAR(150) NOT NULL,
            position VARCHAR(100),
            period VARCHAR(100),
            sort_order SMALLINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS career_application_organization_experiences")
    op.execute("DROP TABLE IF EXISTS career_application_family_members")
    op.execute("DROP TABLE IF EXISTS career_application_social_media_accounts")
    op.execute(
        """
        ALTER TABLE career_applications
            DROP COLUMN IF EXISTS alternative_applied_position,
            DROP COLUMN IF EXISTS grade_point_average,
            DROP COLUMN IF EXISTS school_address,
            DROP COLUMN IF EXISTS school_graduation_year,
            DROP COLUMN IF EXISTS school_entry_year
        """
    )
