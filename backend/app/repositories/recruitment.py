from dataclasses import dataclass
from datetime import UTC
from datetime import date
from datetime import datetime
from typing import Any
from uuid import UUID
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.models import CareerApplicationCommentModel
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


@dataclass(frozen=True)
class CareerApplicationAdminWorkExperienceRecord:
    id: UUID
    company_name: str
    position: str | None
    employment_duration: str | None
    salary: Any
    company_phone_number: str | None
    leaving_reason: str | None
    company_comment: str | None


@dataclass(frozen=True)
class CareerApplicationAdminSocialMediaAccountRecord:
    id: UUID
    platform: str
    account_id: str


@dataclass(frozen=True)
class CareerApplicationAdminFamilyMemberRecord:
    id: UUID
    relationship: str
    name: str
    education_level: str | None
    occupation: str | None
    workplace: str | None


@dataclass(frozen=True)
class CareerApplicationAdminOrganizationExperienceRecord:
    id: UUID
    organization_name: str
    position: str | None
    period: str | None


@dataclass(frozen=True)
class CareerApplicationAdminCommentRecord:
    id: UUID
    admin_user_id: UUID | None
    author_name: str | None
    author_email: str | None
    comment: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class CareerApplicationAdminSummaryRecord:
    id: UUID
    career_job_id: UUID | None
    job_slug: str | None
    job_title: str | None
    job_location: str | None
    job_employment_type: str | None
    division_name: str | None
    position_name: str | None
    full_name: str
    nickname: str
    age: int
    gender: str | None
    phone_number: str
    education_level: str | None
    school_name: str | None
    major: str | None
    applied_position: str
    alternative_applied_position: str | None
    vacancy_source: str
    preferred_area: str | None
    available_interview_date: date | None
    self_photo_url: str | None
    cv_file_url: str | None
    status: str
    applied_at: datetime
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class CareerApplicationAdminRecord(CareerApplicationAdminSummaryRecord):
    identity_number: str
    identity_valid_until: date
    identity_address: str
    domicile_address: str
    driving_license_number: str
    driving_license_class: str | None
    driving_license_valid_until: date
    birth_place: str
    birth_date: date
    marital_status: str | None
    mother_name: str
    religion: str | None
    medical_history: str | None
    school_entry_year: int | None
    school_graduation_year: int | None
    school_address: str | None
    grade_point_average: str | None
    willing_to_be_placed_anywhere: bool
    interview_invitation_reason: str
    social_media_accounts: list[CareerApplicationAdminSocialMediaAccountRecord]
    family_members: list[CareerApplicationAdminFamilyMemberRecord]
    organization_experiences: list[CareerApplicationAdminOrganizationExperienceRecord]
    work_experiences: list[CareerApplicationAdminWorkExperienceRecord]
    comments: list[CareerApplicationAdminCommentRecord]


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
                .options(
                    selectinload(
                        DivisionModel.positions.and_(PositionModel.is_active.is_(True))
                    )
                )
                .where(DivisionModel.is_active.is_(True))
                .order_by(DivisionModel.sort_order)
            )
        )

    def list_admin_divisions(self) -> list[DivisionModel]:
        return list(
            self._session.scalars(
                select(DivisionModel)
                .options(selectinload(DivisionModel.positions))
                .order_by(DivisionModel.sort_order, DivisionModel.name)
            )
        )

    def get_division(self, division_id: UUID) -> DivisionModel | None:
        return self._session.get(DivisionModel, division_id)

    def get_division_by_code(self, code: str) -> DivisionModel | None:
        return self._session.scalar(
            select(DivisionModel).where(DivisionModel.code == code)
        )

    def create_division(
        self,
        *,
        code: str,
        name: str,
        sort_order: int,
        is_active: bool,
    ) -> DivisionModel:
        division = DivisionModel(
            code=code,
            name=name,
            sort_order=sort_order,
            is_active=is_active,
        )
        self._session.add(division)
        self._session.commit()
        self._session.refresh(division)
        return division

    def update_division(
        self,
        division: DivisionModel,
        *,
        name: str | None = None,
        sort_order: int | None = None,
        is_active: bool | None = None,
    ) -> DivisionModel:
        if name is not None:
            division.name = name
        if sort_order is not None:
            division.sort_order = sort_order
        if is_active is not None:
            division.is_active = is_active
        self._session.commit()
        self._session.refresh(division)
        return division

    def delete_division(self, division: DivisionModel) -> None:
        self._session.delete(division)
        self._session.commit()

    def list_admin_positions(self) -> list[PositionModel]:
        return list(
            self._session.scalars(
                select(PositionModel).order_by(
                    PositionModel.sort_order,
                    PositionModel.name,
                )
            )
        )

    def get_position(self, position_id: UUID) -> PositionModel | None:
        return self._session.get(PositionModel, position_id)

    def get_position_by_division_and_code(
        self,
        *,
        division_id: UUID,
        code: str,
    ) -> PositionModel | None:
        return self._session.scalar(
            select(PositionModel).where(
                PositionModel.division_id == division_id,
                PositionModel.code == code,
            )
        )

    def create_position(
        self,
        *,
        division: DivisionModel,
        code: str,
        name: str,
        sort_order: int,
        is_active: bool,
    ) -> PositionModel:
        position = PositionModel(
            division_id=division.id,
            code=code,
            name=name,
            sort_order=sort_order,
            is_active=is_active,
        )
        self._session.add(position)
        self._session.commit()
        self._session.refresh(position)
        return position

    def update_position(
        self,
        position: PositionModel,
        *,
        division: DivisionModel | None = None,
        name: str | None = None,
        sort_order: int | None = None,
        is_active: bool | None = None,
    ) -> PositionModel:
        if division is not None:
            position.division_id = division.id
        if name is not None:
            position.name = name
        if sort_order is not None:
            position.sort_order = sort_order
        if is_active is not None:
            position.is_active = is_active
        self._session.commit()
        self._session.refresh(position)
        return position

    def delete_position(self, position: PositionModel) -> None:
        self._session.delete(position)
        self._session.commit()

    def list_jobs(self) -> list[CareerJobModel]:
        return list(
            self._session.scalars(
                select(CareerJobModel)
                .where(CareerJobModel.is_active.is_(True))
                .order_by(CareerJobModel.sort_order)
            )
        )

    def list_admin_jobs(self) -> list[CareerJobModel]:
        return list(
            self._session.scalars(
                select(CareerJobModel).order_by(
                    CareerJobModel.sort_order,
                    CareerJobModel.title,
                )
            )
        )

    def get_job(self, job_id: UUID) -> CareerJobModel | None:
        return self._session.get(CareerJobModel, job_id)

    def get_job_by_code(self, code: str) -> CareerJobModel | None:
        return self._session.scalar(
            select(CareerJobModel).where(CareerJobModel.code == code)
        )

    def get_job_by_slug(self, slug: str) -> CareerJobModel | None:
        return self._session.scalar(
            select(CareerJobModel).where(
                CareerJobModel.slug == slug,
                CareerJobModel.is_active.is_(True),
            )
        )

    def get_admin_job_by_slug(self, slug: str) -> CareerJobModel | None:
        return self._session.scalar(
            select(CareerJobModel).where(CareerJobModel.slug == slug)
        )

    def create_job(
        self,
        *,
        division: DivisionModel,
        position: PositionModel,
        code: str,
        slug: str,
        title: str,
        location: str,
        employment_type: str,
        summary: str,
        responsibilities: list[str],
        requirements: list[str],
        sort_order: int,
        is_active: bool,
    ) -> CareerJobModel:
        job = CareerJobModel(
            division_id=division.id,
            position_id=position.id,
            code=code,
            slug=slug,
            title=title,
            division_code=division.code,
            division_name=division.name,
            position_code=position.code,
            position_name=position.name,
            location=location,
            employment_type=employment_type,
            summary=summary,
            responsibilities=responsibilities,
            requirements=requirements,
            sort_order=sort_order,
            is_active=is_active,
        )
        self._session.add(job)
        self._session.commit()
        self._session.refresh(job)
        return job

    def update_job(
        self,
        job: CareerJobModel,
        *,
        division: DivisionModel | None = None,
        position: PositionModel | None = None,
        slug: str | None = None,
        title: str | None = None,
        location: str | None = None,
        employment_type: str | None = None,
        summary: str | None = None,
        responsibilities: list[str] | None = None,
        requirements: list[str] | None = None,
        sort_order: int | None = None,
        is_active: bool | None = None,
    ) -> CareerJobModel:
        if division is not None:
            job.division_id = division.id
            job.division_code = division.code
            job.division_name = division.name
        if position is not None:
            job.position_id = position.id
            job.position_code = position.code
            job.position_name = position.name
        if slug is not None:
            job.slug = slug
        if title is not None:
            job.title = title
        if location is not None:
            job.location = location
        if employment_type is not None:
            job.employment_type = employment_type
        if summary is not None:
            job.summary = summary
        if responsibilities is not None:
            job.responsibilities = responsibilities
        if requirements is not None:
            job.requirements = requirements
        if sort_order is not None:
            job.sort_order = sort_order
        if is_active is not None:
            job.is_active = is_active
        self._session.commit()
        self._session.refresh(job)
        return job

    def delete_job(self, job: CareerJobModel) -> None:
        self._session.delete(job)
        self._session.commit()

    def list_admin_career_applications(
        self,
    ) -> list[CareerApplicationAdminSummaryRecord]:
        applications = self._session.scalars(
            select(CareerApplicationModel)
            .options(selectinload(CareerApplicationModel.career_job))
            .order_by(
                CareerApplicationModel.applied_at.desc(),
                CareerApplicationModel.created_at.desc(),
            )
        )
        return [
            self._career_application_admin_summary_record(application)
            for application in applications
        ]

    def get_career_application(
        self,
        application_id: UUID,
    ) -> CareerApplicationModel | None:
        return self._session.scalar(
            select(CareerApplicationModel)
            .options(
                selectinload(CareerApplicationModel.career_job),
                selectinload(CareerApplicationModel.family_members),
                selectinload(CareerApplicationModel.organization_experiences),
                selectinload(CareerApplicationModel.social_media_accounts),
                selectinload(CareerApplicationModel.work_experiences),
                selectinload(CareerApplicationModel.comments).selectinload(
                    CareerApplicationCommentModel.admin_user
                ),
            )
            .where(CareerApplicationModel.id == application_id)
        )

    def update_career_application_status(
        self,
        application: CareerApplicationModel,
        *,
        status: str,
    ) -> CareerApplicationAdminRecord:
        application.status = status
        self._session.commit()
        self._session.refresh(application)
        return self._career_application_admin_record(application)

    def career_application_admin_record(
        self,
        application: CareerApplicationModel,
    ) -> CareerApplicationAdminRecord:
        return self._career_application_admin_record(application)

    def create_career_application_comment(
        self,
        application: CareerApplicationModel,
        *,
        admin_user_id: UUID,
        comment: str,
    ) -> CareerApplicationAdminCommentRecord:
        application_comment = CareerApplicationCommentModel(
            career_application_id=application.id,
            admin_user_id=admin_user_id,
            comment=comment,
        )
        self._session.add(application_comment)
        self._session.commit()
        self._session.refresh(application_comment)
        application_comment = self._session.scalar(
            select(CareerApplicationCommentModel)
            .options(selectinload(CareerApplicationCommentModel.admin_user))
            .where(CareerApplicationCommentModel.id == application_comment.id)
        )
        if application_comment is None:
            raise RuntimeError("Career application comment was not created.")
        return self._career_application_comment_record(application_comment)

    def _career_application_admin_record(
        self,
        application: CareerApplicationModel,
    ) -> CareerApplicationAdminRecord:
        summary = self._career_application_admin_summary_record(application)
        return CareerApplicationAdminRecord(
            **summary.__dict__,
            identity_number=application.identity_number,
            identity_valid_until=application.identity_valid_until,
            identity_address=application.identity_address,
            domicile_address=application.domicile_address,
            driving_license_number=application.driving_license_number,
            driving_license_class=application.driving_license_class,
            driving_license_valid_until=application.driving_license_valid_until,
            birth_place=application.birth_place,
            birth_date=application.birth_date,
            marital_status=application.marital_status,
            mother_name=application.mother_name,
            religion=application.religion,
            medical_history=application.medical_history,
            school_entry_year=application.school_entry_year,
            school_graduation_year=application.school_graduation_year,
            school_address=application.school_address,
            grade_point_average=application.grade_point_average,
            willing_to_be_placed_anywhere=application.willing_to_be_placed_anywhere,
            interview_invitation_reason=application.interview_invitation_reason,
            social_media_accounts=[
                CareerApplicationAdminSocialMediaAccountRecord(
                    id=account.id,
                    platform=account.platform,
                    account_id=account.account_id,
                )
                for account in application.social_media_accounts
            ],
            family_members=[
                CareerApplicationAdminFamilyMemberRecord(
                    id=member.id,
                    relationship=member.relationship,
                    name=member.name,
                    education_level=member.education_level,
                    occupation=member.occupation,
                    workplace=member.workplace,
                )
                for member in application.family_members
            ],
            organization_experiences=[
                CareerApplicationAdminOrganizationExperienceRecord(
                    id=experience.id,
                    organization_name=experience.organization_name,
                    position=experience.position,
                    period=experience.period,
                )
                for experience in application.organization_experiences
            ],
            work_experiences=[
                CareerApplicationAdminWorkExperienceRecord(
                    id=experience.id,
                    company_name=experience.company_name,
                    position=experience.position,
                    employment_duration=experience.employment_duration,
                    salary=experience.salary,
                    company_phone_number=experience.company_phone_number,
                    leaving_reason=experience.leaving_reason,
                    company_comment=experience.company_comment,
                )
                for experience in application.work_experiences
            ],
            comments=[
                self._career_application_comment_record(comment)
                for comment in application.comments
            ],
        )

    def _career_application_admin_summary_record(
        self,
        application: CareerApplicationModel,
    ) -> CareerApplicationAdminSummaryRecord:
        job = application.career_job
        return CareerApplicationAdminSummaryRecord(
            id=application.id,
            career_job_id=application.career_job_id,
            job_slug=job.slug if job is not None else None,
            job_title=job.title if job is not None else None,
            job_location=job.location if job is not None else None,
            job_employment_type=job.employment_type if job is not None else None,
            division_name=job.division_name if job is not None else None,
            position_name=job.position_name if job is not None else None,
            full_name=application.full_name,
            nickname=application.nickname,
            age=application.age,
            gender=application.gender,
            phone_number=application.phone_number,
            education_level=application.education_level,
            school_name=application.school_name,
            major=application.major,
            applied_position=application.applied_position,
            alternative_applied_position=application.alternative_applied_position,
            vacancy_source=application.vacancy_source,
            preferred_area=application.preferred_area,
            available_interview_date=application.available_interview_date,
            self_photo_url=application.self_photo_url,
            cv_file_url=application.cv_file_url,
            status=application.status,
            applied_at=application.applied_at,
            created_at=application.created_at,
            updated_at=application.updated_at,
        )

    def _career_application_comment_record(
        self,
        comment: CareerApplicationCommentModel,
    ) -> CareerApplicationAdminCommentRecord:
        admin_user = comment.admin_user
        return CareerApplicationAdminCommentRecord(
            id=comment.id,
            admin_user_id=comment.admin_user_id,
            author_name=admin_user.full_name if admin_user is not None else None,
            author_email=admin_user.email if admin_user is not None else None,
            comment=comment.comment,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
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
