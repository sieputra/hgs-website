from dataclasses import dataclass
from datetime import UTC
from datetime import datetime
from typing import Any
from uuid import UUID
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.models import CareerApplicationModel
from app.models import CareerApplicationFamilyMemberModel
from app.models import CareerApplicationOrganizationExperienceModel
from app.models import CareerApplicationSocialMediaAccountModel
from app.models import CareerApplicationWorkExperienceModel
from app.models import CareerJobModel
from app.models import ContactModel
from app.models import DivisionModel
from app.models import PositionModel


@dataclass(frozen=True)
class PositionRecord:
    code: str
    name: str
    sort_order: int
    is_active: bool = True


@dataclass(frozen=True)
class DivisionRecord:
    code: str
    name: str
    sort_order: int
    positions: tuple[PositionRecord, ...]
    is_active: bool = True


@dataclass(frozen=True)
class CareerJobRecord:
    code: str
    slug: str
    title: str
    division_code: str
    division_name: str
    position_code: str
    position_name: str
    location: str
    employment_type: str
    summary: str
    responsibilities: tuple[str, ...]
    requirements: tuple[str, ...]
    sort_order: int
    is_active: bool = True


@dataclass(frozen=True)
class SubmissionReceiptRecord:
    id: UUID
    status: str
    submitted_at: datetime


class RecruitmentRepository:
    """Seed-backed recruitment data until PostgreSQL persistence is added."""

    _divisions = (
        DivisionRecord(
            code="OPERATIONAL_TRANSPORT",
            name="OPERATIONAL TRANSPORT",
            sort_order=1,
            positions=(
                PositionRecord("MT_TRANSPORT_LOGISTIC", "MT Transport/Logistic", 1),
                PositionRecord("SPV_TRANSPORT", "SPV Transport", 2),
                PositionRecord("KOORD_TRANSPORT", "Koord. Transport", 3),
                PositionRecord("DISPATCHER", "Dispatcher", 4),
                PositionRecord("DATA_ENTRY", "Data Entry", 5),
                PositionRecord("CHECKER_PLANT", "Checker Plant", 6),
                PositionRecord("DRIVER", "Driver", 7),
                PositionRecord("HELPER", "Helper", 8),
            ),
        ),
        DivisionRecord(
            code="DIVISI_HR_GA",
            name="DIVISI HR GA",
            sort_order=2,
            positions=(
                PositionRecord("CHIF_SECURITY", "Chif Security", 1),
                PositionRecord("SPV_GA", "SPV GA", 2),
                PositionRecord("FIELD_RECRUITER", "Field Recruiter", 3),
                PositionRecord("STAFF_HRD", "Staff HRD", 4),
                PositionRecord("KOORD_GA", "Koord. GA", 5),
                PositionRecord("SECURITY", "Security", 6),
                PositionRecord("STAFF_UMUM", "Staff Umum", 7),
                PositionRecord("DRAFTER", "Drafter", 8),
            ),
        ),
        DivisionRecord(
            code="DIVISI_FINANCE",
            name="DIVISI FINANCE",
            sort_order=3,
            positions=(
                PositionRecord("PURCHASING", "Purchasing", 1),
                PositionRecord("CASHIER", "Cashier", 2),
                PositionRecord("MT_FINANCE", "MT Finance", 3),
                PositionRecord("STAFF_AR", "Staff AR", 4),
                PositionRecord("STAFF_ACCOUNTING", "Staff Accounting", 5),
                PositionRecord("STAFF_PAJAK", "Staff Pajak", 6),
                PositionRecord("STAFF_PAYROLL", "Staff Payroll", 7),
                PositionRecord("AUDITOR_INTERNAL", "Auditor Internal", 8),
                PositionRecord("LEGAL", "Legal", 9),
            ),
        ),
        DivisionRecord(
            code="DIVISI_FLEET",
            name="DIVISI FLEET",
            sort_order=4,
            positions=(
                PositionRecord("SPV_FLEET", "SPV Fleet", 1),
                PositionRecord("KOORD_FLEET", "Koord. Fleet", 2),
                PositionRecord("MEKANIK_MIDLE", "Mekanik Midle", 3),
                PositionRecord("SERVICE_OFFICER", "Service Officer", 4),
                PositionRecord("MEKANIK_JUNIOR", "Mekanik Junior", 5),
                PositionRecord("MEKANIK_SENIOR", "Mekanik Senior", 6),
                PositionRecord("PETROLL_MAN", "Petroll Man", 7),
                PositionRecord("TYRE_MAN", "Tyre Man", 8),
            ),
        ),
        DivisionRecord(
            code="DIVISI_PROJECT",
            name="DIVISI PROJECT",
            sort_order=5,
            positions=(
                PositionRecord("PIC_PROJECT", "PIC Project", 1),
                PositionRecord(
                    "BD_BUSSINES_DEVELOPMENT",
                    "BD (Bussines Development)",
                    2,
                ),
            ),
        ),
        DivisionRecord(
            code="DIVISI_WAREHOUSE",
            name="DIVISI WAREHOUSE",
            sort_order=6,
            positions=(
                PositionRecord("SPV_GUDANG", "SPV Gudang", 1),
                PositionRecord("KEPALA_GUDANG", "Kepala Gudang", 2),
                PositionRecord("LEADER_SHIFT_GUDANG", "Leader Shift Gudang", 3),
                PositionRecord("ADMIN_GUDANG", "Admin Gudang", 4),
                PositionRecord("STAFF_GUDANG", "Staff Gudang", 5),
                PositionRecord("CHECKER", "Checker", 6),
                PositionRecord("OPERATOR_FORKLIP", "Operator Forklip", 7),
                PositionRecord("CHECKER_GUDANG", "Checker Gudang", 8),
            ),
        ),
        DivisionRecord(
            code="DIVISI_IT",
            name="DIVISI IT",
            sort_order=7,
            positions=(
                PositionRecord("SPV_IT", "SPV IT", 1),
                PositionRecord("SENIOR_PROGRAMMER", "Senior Programmer", 2),
                PositionRecord("JUNIOR_PROGRAMMER", "Junior Programmer", 3),
                PositionRecord("IT_SUPPORT", "IT Support", 4),
            ),
        ),
        DivisionRecord(
            code="DIVISI_RESTAURANT",
            name="DIVISI RESTAURANT",
            sort_order=8,
            positions=(
                PositionRecord("MANAGER_RESTO", "Manager Resto", 1),
                PositionRecord("WAITER", "Waiter", 2),
                PositionRecord("COOK_HELPER", "Cook Helper", 3),
                PositionRecord("STAFF_GUDANG_RESTO", "Staff Gudang Resto", 4),
            ),
        ),
        DivisionRecord(
            code="DIVISI_SALES",
            name="DIVISI SALES",
            sort_order=9,
            positions=(
                PositionRecord("ADMIN_SALES", "Admin Sales", 1),
                PositionRecord("SALES_TO", "Sales TO", 2),
                PositionRecord("SMD", "SMD", 3),
                PositionRecord("SPV_SALES", "SPV Sales", 4),
                PositionRecord("MT_SALES", "Mt Sales", 5),
                PositionRecord(
                    "OM_OPERATION_MANAGER_SALES",
                    "OM (Operation Manager Sales)",
                    6,
                ),
                PositionRecord("DESIGN_GRAFIS", "Design Grafis", 7),
            ),
        ),
    )

    _jobs = (
        CareerJobRecord(
            code="DRIVER_OPERASIONAL",
            slug="driver-operasional",
            title="Driver Operasional",
            division_code="OPERATIONAL_TRANSPORT",
            division_name="OPERATIONAL TRANSPORT",
            position_code="DRIVER",
            position_name="Driver",
            location="Jakarta, Tangerang, Jawa Barat",
            employment_type="Full-time",
            summary="Mendukung operasional distribusi dan pengiriman pelanggan HGS.",
            responsibilities=(
                "Melakukan pengantaran sesuai rute dan jadwal operasional.",
                "Menjaga kelayakan kendaraan sebelum dan sesudah perjalanan.",
                "Berkoordinasi dengan dispatcher dan tim lapangan.",
            ),
            requirements=(
                "Memiliki SIM aktif sesuai kebutuhan unit.",
                "Memahami area Jakarta, Tangerang, atau Jawa Barat.",
                "Disiplin, jujur, dan siap mengikuti arahan operasional.",
            ),
            sort_order=1,
        ),
        CareerJobRecord(
            code="HELPER_GUDANG",
            slug="helper-gudang",
            title="Helper Gudang",
            division_code="DIVISI_WAREHOUSE",
            division_name="DIVISI WAREHOUSE",
            position_code="STAFF_GUDANG",
            position_name="Staff Gudang",
            location="Jabodetabek dan Jawa Barat",
            employment_type="Full-time",
            summary="Membantu aktivitas inbound, outbound, dan kerapihan area gudang.",
            responsibilities=(
                "Membantu proses bongkar muat barang.",
                "Menata barang sesuai instruksi leader shift.",
                "Menjaga kebersihan dan keselamatan area kerja.",
            ),
            requirements=(
                "Teliti dan mampu bekerja dalam tim.",
                "Bersedia bekerja mengikuti jadwal operasional gudang.",
                "Pengalaman gudang menjadi nilai tambah.",
            ),
            sort_order=2,
        ),
        CareerJobRecord(
            code="STAFF_HRD",
            slug="staff-hrd",
            title="Staff HRD",
            division_code="DIVISI_HR_GA",
            division_name="DIVISI HR GA",
            position_code="STAFF_HRD",
            position_name="Staff HRD",
            location="Jakarta Selatan",
            employment_type="Full-time",
            summary="Mendukung administrasi HR, rekrutmen, dan kebutuhan karyawan.",
            responsibilities=(
                "Mengelola data kandidat dan proses administrasi rekrutmen.",
                "Mendukung komunikasi dengan kandidat dan karyawan.",
                "Membantu pelaporan HR sesuai kebutuhan operasional.",
            ),
            requirements=(
                "Memahami administrasi HR dasar.",
                "Komunikatif dan rapi dalam pengelolaan data.",
                "Mampu menggunakan aplikasi perkantoran.",
            ),
            sort_order=3,
        ),
    )

    _contact_submissions: list[dict[str, Any]] = []
    _career_application_submissions: list[dict[str, Any]] = []

    def list_divisions(self) -> list[DivisionRecord]:
        return sorted(
            (
                DivisionRecord(
                    code=division.code,
                    name=division.name,
                    sort_order=division.sort_order,
                    positions=tuple(
                        sorted(
                            (
                                position
                                for position in division.positions
                                if position.is_active
                            ),
                            key=lambda position: position.sort_order,
                        )
                    ),
                )
                for division in self._divisions
                if division.is_active
            ),
            key=lambda division: division.sort_order,
        )

    def list_jobs(self) -> list[CareerJobRecord]:
        return sorted(
            (job for job in self._jobs if job.is_active),
            key=lambda job: job.sort_order,
        )

    def get_job_by_slug(self, slug: str) -> CareerJobRecord | None:
        return next(
            (job for job in self._jobs if job.slug == slug and job.is_active),
            None,
        )

    def create_contact_submission(
        self,
        payload: dict[str, Any],
    ) -> SubmissionReceiptRecord:
        receipt = SubmissionReceiptRecord(
            id=uuid4(),
            status="submitted",
            submitted_at=datetime.now(UTC),
        )
        self._contact_submissions.append({"receipt": receipt, "payload": payload})
        return receipt

    def create_career_application(
        self,
        payload: dict[str, Any],
    ) -> SubmissionReceiptRecord:
        receipt = SubmissionReceiptRecord(
            id=uuid4(),
            status="submitted",
            submitted_at=datetime.now(UTC),
        )
        self._career_application_submissions.append(
            {"receipt": receipt, "payload": payload}
        )
        return receipt


class DatabaseRecruitmentRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_divisions(self) -> list[DivisionModel]:
        return list(
            self._session.scalars(
                select(DivisionModel)
                .options(selectinload(DivisionModel.positions))
                .where(DivisionModel.is_active.is_(True))
                .order_by(DivisionModel.sort_order)
            )
        )

    def list_jobs(self) -> list[CareerJobModel]:
        return list(
            self._session.scalars(
                select(CareerJobModel)
                .where(CareerJobModel.is_active.is_(True))
                .order_by(CareerJobModel.sort_order)
            )
        )

    def get_job_by_slug(self, slug: str) -> CareerJobModel | None:
        return self._session.scalar(
            select(CareerJobModel).where(
                CareerJobModel.slug == slug,
                CareerJobModel.is_active.is_(True),
            )
        )

    def create_contact_submission(
        self,
        payload: dict[str, Any],
    ) -> SubmissionReceiptRecord:
        contact = ContactModel(**payload)
        self._session.add(contact)
        self._session.commit()
        self._session.refresh(contact)
        return SubmissionReceiptRecord(
            id=contact.id,
            status=contact.status,
            submitted_at=contact.submitted_at,
        )

    def create_career_application(
        self,
        payload: dict[str, Any],
    ) -> SubmissionReceiptRecord:
        family_members = payload.pop("family_members", [])
        organization_experiences = payload.pop("organization_experiences", [])
        social_media_accounts = payload.pop("social_media_accounts", [])
        work_experiences = payload.pop("work_experiences", [])
        career_job_slug = payload.pop("career_job_slug", None)
        career_job_id = None

        if career_job_slug is not None:
            career_job = self.get_job_by_slug(career_job_slug)
            if career_job is not None:
                career_job_id = career_job.id

        application = CareerApplicationModel(
            career_job_id=career_job_id,
            **payload,
        )
        application.work_experiences = [
            CareerApplicationWorkExperienceModel(
                sort_order=index,
                **work_experience,
            )
            for index, work_experience in enumerate(work_experiences, start=1)
        ]
        application.social_media_accounts = [
            CareerApplicationSocialMediaAccountModel(
                sort_order=index,
                **social_media_account,
            )
            for index, social_media_account in enumerate(
                social_media_accounts,
                start=1,
            )
        ]
        application.family_members = [
            CareerApplicationFamilyMemberModel(
                sort_order=index,
                **family_member,
            )
            for index, family_member in enumerate(family_members, start=1)
        ]
        application.organization_experiences = [
            CareerApplicationOrganizationExperienceModel(
                sort_order=index,
                **organization_experience,
            )
            for index, organization_experience in enumerate(
                organization_experiences,
                start=1,
            )
        ]
        self._session.add(application)
        self._session.commit()
        self._session.refresh(application)
        return SubmissionReceiptRecord(
            id=application.id,
            status=application.status,
            submitted_at=application.applied_at,
        )
