"""seed initial public and recruitment data

Revision ID: 20260522_0002
Revises: 20260522_0001
Create Date: 2026-05-22
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy.orm import Session

from app.db.seed import seed_database


revision: str = "20260522_0002"
down_revision: str | Sequence[str] | None = "20260522_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)
    seed_database(session)
    session.flush()


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM career_jobs
        WHERE code IN (
            'DRIVER_OPERASIONAL',
            'HELPER_GUDANG',
            'STAFF_HRD'
        )
        """
    )
    op.execute(
        """
        DELETE FROM positions
        WHERE code IN (
            'MT_TRANSPORT_LOGISTIC',
            'SPV_TRANSPORT',
            'KOORD_TRANSPORT',
            'DISPATCHER',
            'DATA_ENTRY',
            'CHECKER_PLANT',
            'DRIVER',
            'HELPER',
            'CHIF_SECURITY',
            'SPV_GA',
            'FIELD_RECRUITER',
            'STAFF_HRD',
            'KOORD_GA',
            'SECURITY',
            'STAFF_UMUM',
            'DRAFTER',
            'PURCHASING',
            'CASHIER',
            'MT_FINANCE',
            'STAFF_AR',
            'STAFF_ACCOUNTING',
            'STAFF_PAJAK',
            'STAFF_PAYROLL',
            'AUDITOR_INTERNAL',
            'LEGAL',
            'SPV_FLEET',
            'KOORD_FLEET',
            'MEKANIK_MIDLE',
            'SERVICE_OFFICER',
            'MEKANIK_JUNIOR',
            'MEKANIK_SENIOR',
            'PETROLL_MAN',
            'TYRE_MAN',
            'PIC_PROJECT',
            'BD_BUSSINES_DEVELOPMENT',
            'SPV_GUDANG',
            'KEPALA_GUDANG',
            'LEADER_SHIFT_GUDANG',
            'ADMIN_GUDANG',
            'STAFF_GUDANG',
            'CHECKER',
            'OPERATOR_FORKLIP',
            'CHECKER_GUDANG',
            'SPV_IT',
            'SENIOR_PROGRAMMER',
            'JUNIOR_PROGRAMMER',
            'IT_SUPPORT',
            'MANAGER_RESTO',
            'WAITER',
            'COOK_HELPER',
            'STAFF_GUDANG_RESTO',
            'ADMIN_SALES',
            'SALES_TO',
            'SMD',
            'SPV_SALES',
            'MT_SALES',
            'OM_OPERATION_MANAGER_SALES',
            'DESIGN_GRAFIS'
        )
        """
    )
    op.execute(
        """
        DELETE FROM divisions
        WHERE code IN (
            'OPERATIONAL_TRANSPORT',
            'DIVISI_HR_GA',
            'DIVISI_FINANCE',
            'DIVISI_FLEET',
            'DIVISI_PROJECT',
            'DIVISI_WAREHOUSE',
            'DIVISI_IT',
            'DIVISI_RESTAURANT',
            'DIVISI_SALES'
        )
        """
    )
    op.execute(
        """
        DELETE FROM faqs
        WHERE code IN (
            'BUSINESS_FIELD',
            'COMPANY_LOCATION',
            'OUTSOURCING_COMPANY',
            'COMPANY_CLIENTS',
            'PLACEMENT_LOCATIONS',
            'INTERVIEW_AFTER_WA_OR_PHONE',
            'NO_EXPERIENCE_APPLY',
            'INTERNSHIP_MEANING',
            'ONLINE_INTERVIEW_OUT_OF_TOWN',
            'HOW_TO_APPLY',
            'INTERVIEW_REQUIREMENTS',
            'AFTER_INTERVIEW_STATUS',
            'RECRUITMENT_FEE',
            'COMPANY_ESTABLISHED',
            'CAREER_PATH',
            'BPJS_BENEFIT',
            'THR_BENEFIT'
        )
        """
    )
    op.execute(
        """
        DELETE FROM services
        WHERE code IN (
            'TRUCKING',
            'WAREHOUSING',
            'FIRST_MILE_DELIVERY',
            'LAST_MILE_DELIVERY',
            'DISTRIBUTION_CENTER',
            'E_FULFILLMENT'
        )
        """
    )
