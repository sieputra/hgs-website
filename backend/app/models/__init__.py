from datetime import datetime
from datetime import date
from decimal import Decimal
from uuid import UUID
from uuid import uuid4

from sqlalchemy import Boolean
from sqlalchemy import Date
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Numeric
from sqlalchemy import SmallInteger
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import UniqueConstraint
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship as orm_relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class PublicServiceModel(TimestampMixin, Base):
    __tablename__ = "services"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class FAQModel(TimestampMixin, Base):
    __tablename__ = "faqs"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class GalleryImageModel(TimestampMixin, Base):
    __tablename__ = "gallery_images"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    caption: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    image_alt: Mapped[str] = mapped_column(String(250), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(255))
    content_type: Mapped[str | None] = mapped_column(String(100))
    file_size: Mapped[int | None] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class DivisionModel(TimestampMixin, Base):
    __tablename__ = "divisions"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    positions: Mapped[list["PositionModel"]] = orm_relationship(
        back_populates="division",
        cascade="all, delete-orphan",
        order_by="PositionModel.sort_order",
    )


class PositionModel(TimestampMixin, Base):
    __tablename__ = "positions"
    __table_args__ = (
        UniqueConstraint("division_id", "code", name="uq_positions_division_code"),
    )

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    division_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("divisions.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    division: Mapped[DivisionModel] = orm_relationship(back_populates="positions")


class CareerJobModel(TimestampMixin, Base):
    __tablename__ = "career_jobs"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    division_id: Mapped[UUID | None] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("divisions.id", ondelete="SET NULL"),
    )
    position_id: Mapped[UUID | None] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("positions.id", ondelete="SET NULL"),
    )
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    division_code: Mapped[str] = mapped_column(String(50), nullable=False)
    division_name: Mapped[str] = mapped_column(String(150), nullable=False)
    position_code: Mapped[str] = mapped_column(String(80), nullable=False)
    position_name: Mapped[str] = mapped_column(String(150), nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    employment_type: Mapped[str] = mapped_column(String(80), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    responsibilities: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    requirements: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ContactModel(TimestampMixin, Base):
    __tablename__ = "contacts"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(30))
    company_name: Mapped[str | None] = mapped_column(String(150))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="submitted",
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class CareerApplicationModel(TimestampMixin, Base):
    __tablename__ = "career_applications"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    career_job_id: Mapped[UUID | None] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("career_jobs.id", ondelete="SET NULL"),
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    identity_number: Mapped[str] = mapped_column(String(32), nullable=False)
    identity_valid_until: Mapped[date] = mapped_column(Date, nullable=False)
    identity_address: Mapped[str] = mapped_column(Text, nullable=False)
    domicile_address: Mapped[str] = mapped_column(Text, nullable=False)
    driving_license_number: Mapped[str] = mapped_column(String(32), nullable=False)
    driving_license_class: Mapped[str | None] = mapped_column(String(20))
    driving_license_valid_until: Mapped[date] = mapped_column(Date, nullable=False)
    birth_place: Mapped[str] = mapped_column(String(100), nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    age: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    marital_status: Mapped[str | None] = mapped_column(String(50))
    gender: Mapped[str | None] = mapped_column(String(30))
    mother_name: Mapped[str] = mapped_column(String(150), nullable=False)
    religion: Mapped[str | None] = mapped_column(String(50))
    phone_number: Mapped[str] = mapped_column(String(30), nullable=False)
    medical_history: Mapped[str | None] = mapped_column(Text)
    education_level: Mapped[str | None] = mapped_column(String(100))
    school_name: Mapped[str | None] = mapped_column(String(150))
    major: Mapped[str | None] = mapped_column(String(150))
    school_entry_year: Mapped[int | None] = mapped_column(SmallInteger)
    school_graduation_year: Mapped[int | None] = mapped_column(SmallInteger)
    school_address: Mapped[str | None] = mapped_column(Text)
    grade_point_average: Mapped[str | None] = mapped_column(String(30))
    applied_position: Mapped[str] = mapped_column(String(100), nullable=False)
    alternative_applied_position: Mapped[str | None] = mapped_column(String(100))
    vacancy_source: Mapped[str] = mapped_column(String(100), nullable=False)
    preferred_area: Mapped[str | None] = mapped_column(String(100))
    willing_to_be_placed_anywhere: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )
    available_interview_date: Mapped[date | None] = mapped_column(Date)
    interview_invitation_reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="submitted",
    )
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    work_experiences: Mapped[list["CareerApplicationWorkExperienceModel"]] = (
        orm_relationship(
            back_populates="career_application",
            cascade="all, delete-orphan",
            order_by="CareerApplicationWorkExperienceModel.sort_order",
        )
    )
    social_media_accounts: Mapped[
        list["CareerApplicationSocialMediaAccountModel"]
    ] = orm_relationship(
        back_populates="career_application",
        cascade="all, delete-orphan",
        order_by="CareerApplicationSocialMediaAccountModel.sort_order",
    )
    family_members: Mapped[list["CareerApplicationFamilyMemberModel"]] = (
        orm_relationship(
            back_populates="career_application",
            cascade="all, delete-orphan",
            order_by="CareerApplicationFamilyMemberModel.sort_order",
        )
    )
    organization_experiences: Mapped[
        list["CareerApplicationOrganizationExperienceModel"]
    ] = orm_relationship(
        back_populates="career_application",
        cascade="all, delete-orphan",
        order_by="CareerApplicationOrganizationExperienceModel.sort_order",
    )


class CareerApplicationWorkExperienceModel(TimestampMixin, Base):
    __tablename__ = "career_application_work_experiences"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    career_application_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("career_applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    company_name: Mapped[str] = mapped_column(String(150), nullable=False)
    position: Mapped[str | None] = mapped_column(String(100))
    employment_duration: Mapped[str | None] = mapped_column(String(100))
    salary: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    company_phone_number: Mapped[str | None] = mapped_column(String(30))
    leaving_reason: Mapped[str | None] = mapped_column(Text)
    company_comment: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    career_application: Mapped[CareerApplicationModel] = orm_relationship(
        back_populates="work_experiences"
    )


class CareerApplicationSocialMediaAccountModel(TimestampMixin, Base):
    __tablename__ = "career_application_social_media_accounts"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    career_application_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("career_applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    account_id: Mapped[str] = mapped_column(String(150), nullable=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    career_application: Mapped[CareerApplicationModel] = orm_relationship(
        back_populates="social_media_accounts"
    )


class CareerApplicationFamilyMemberModel(TimestampMixin, Base):
    __tablename__ = "career_application_family_members"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    career_application_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("career_applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    relationship: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    education_level: Mapped[str | None] = mapped_column(String(100))
    occupation: Mapped[str | None] = mapped_column(String(150))
    workplace: Mapped[str | None] = mapped_column(String(150))
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    career_application: Mapped[CareerApplicationModel] = orm_relationship(
        back_populates="family_members"
    )


class CareerApplicationOrganizationExperienceModel(TimestampMixin, Base):
    __tablename__ = "career_application_organization_experiences"

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    career_application_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("career_applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    organization_name: Mapped[str] = mapped_column(String(150), nullable=False)
    position: Mapped[str | None] = mapped_column(String(100))
    period: Mapped[str | None] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    career_application: Mapped[CareerApplicationModel] = orm_relationship(
        back_populates="organization_experiences"
    )
