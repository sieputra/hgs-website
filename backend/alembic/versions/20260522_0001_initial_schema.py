"""create initial backend schema

Revision ID: 20260522_0001
Revises:
Create Date: 2026-05-22
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260522_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS services (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(100) NOT NULL UNIQUE,
            title VARCHAR(150) NOT NULL,
            summary TEXT NOT NULL,
            sort_order SMALLINT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS faqs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(100) NOT NULL UNIQUE,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            sort_order SMALLINT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS divisions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(150) NOT NULL,
            sort_order SMALLINT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS positions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
            code VARCHAR(80) NOT NULL,
            name VARCHAR(150) NOT NULL,
            sort_order SMALLINT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_positions_division_code UNIQUE (division_id, code)
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS career_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
            position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
            code VARCHAR(100) NOT NULL UNIQUE,
            slug VARCHAR(150) NOT NULL UNIQUE,
            title VARCHAR(150) NOT NULL,
            division_code VARCHAR(50) NOT NULL,
            division_name VARCHAR(150) NOT NULL,
            position_code VARCHAR(80) NOT NULL,
            position_name VARCHAR(150) NOT NULL,
            location VARCHAR(150) NOT NULL,
            employment_type VARCHAR(80) NOT NULL,
            summary TEXT NOT NULL,
            responsibilities JSONB NOT NULL,
            requirements JSONB NOT NULL,
            sort_order SMALLINT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS contacts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL,
            phone_number VARCHAR(30),
            company_name VARCHAR(150),
            message TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'submitted',
            submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS career_applications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            career_job_id UUID REFERENCES career_jobs(id) ON DELETE SET NULL,
            full_name VARCHAR(150) NOT NULL,
            nickname VARCHAR(100) NOT NULL,
            identity_number VARCHAR(32) NOT NULL,
            identity_valid_until DATE NOT NULL,
            identity_address TEXT NOT NULL,
            domicile_address TEXT NOT NULL,
            driving_license_number VARCHAR(32) NOT NULL,
            driving_license_class VARCHAR(20),
            driving_license_valid_until DATE NOT NULL,
            birth_place VARCHAR(100) NOT NULL,
            birth_date DATE NOT NULL,
            age SMALLINT NOT NULL,
            marital_status VARCHAR(50),
            gender VARCHAR(30),
            mother_name VARCHAR(150) NOT NULL,
            religion VARCHAR(50),
            phone_number VARCHAR(30) NOT NULL,
            medical_history TEXT,
            education_level VARCHAR(100),
            school_name VARCHAR(150),
            major VARCHAR(150),
            applied_position VARCHAR(100) NOT NULL,
            vacancy_source VARCHAR(100) NOT NULL,
            preferred_area VARCHAR(100),
            willing_to_be_placed_anywhere BOOLEAN NOT NULL,
            available_interview_date DATE,
            interview_invitation_reason TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'submitted',
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS career_application_work_experiences (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            career_application_id UUID NOT NULL
                REFERENCES career_applications(id) ON DELETE CASCADE,
            company_name VARCHAR(150) NOT NULL,
            position VARCHAR(100),
            employment_duration VARCHAR(100),
            salary NUMERIC(14, 2),
            company_phone_number VARCHAR(30),
            leaving_reason TEXT,
            company_comment TEXT,
            sort_order SMALLINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS career_application_work_experiences")
    op.execute("DROP TABLE IF EXISTS career_applications")
    op.execute("DROP TABLE IF EXISTS contacts")
    op.execute("DROP TABLE IF EXISTS career_jobs")
    op.execute("DROP TABLE IF EXISTS positions")
    op.execute("DROP TABLE IF EXISTS divisions")
    op.execute("DROP TABLE IF EXISTS faqs")
    op.execute("DROP TABLE IF EXISTS services")
