from datetime import date
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field


class Position(BaseModel):
    code: str
    name: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class Division(BaseModel):
    code: str
    name: str
    sort_order: int
    positions: list[Position]

    model_config = ConfigDict(from_attributes=True)


class PositionAdmin(Position):
    id: UUID
    division_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PositionCreate(BaseModel):
    division_id: UUID
    code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=150)
    sort_order: int = Field(ge=0, le=32767)
    is_active: bool = True


class PositionUpdate(BaseModel):
    division_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=150)
    sort_order: int | None = Field(default=None, ge=0, le=32767)
    is_active: bool | None = None


class DivisionAdmin(BaseModel):
    id: UUID
    code: str
    name: str
    sort_order: int
    is_active: bool
    positions: list[PositionAdmin]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DivisionCreate(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    sort_order: int = Field(ge=0, le=32767)
    is_active: bool = True


class DivisionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    sort_order: int | None = Field(default=None, ge=0, le=32767)
    is_active: bool | None = None


class CareerJob(BaseModel):
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
    responsibilities: list[str]
    requirements: list[str]
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class CareerJobAdmin(CareerJob):
    id: UUID
    division_id: UUID | None
    position_id: UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CareerJobCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=150)
    title: str = Field(min_length=1, max_length=150)
    division_id: UUID
    position_id: UUID
    location: str = Field(min_length=1, max_length=150)
    employment_type: str = Field(min_length=1, max_length=80)
    summary: str = Field(min_length=1)
    responsibilities: list[str] = Field(min_length=1, max_length=20)
    requirements: list[str] = Field(min_length=1, max_length=20)
    sort_order: int = Field(ge=0, le=32767)
    is_active: bool = True


class CareerJobUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=150)
    title: str | None = Field(default=None, min_length=1, max_length=150)
    division_id: UUID | None = None
    position_id: UUID | None = None
    location: str | None = Field(default=None, min_length=1, max_length=150)
    employment_type: str | None = Field(default=None, min_length=1, max_length=80)
    summary: str | None = Field(default=None, min_length=1)
    responsibilities: list[str] | None = Field(default=None, min_length=1, max_length=20)
    requirements: list[str] | None = Field(default=None, min_length=1, max_length=20)
    sort_order: int | None = Field(default=None, ge=0, le=32767)
    is_active: bool | None = None


class CareerApplicationAdminWorkExperience(BaseModel):
    id: UUID
    company_name: str
    position: str | None
    employment_duration: str | None
    salary: Decimal | None
    company_phone_number: str | None
    leaving_reason: str | None
    company_comment: str | None

    model_config = ConfigDict(from_attributes=True)


class CareerApplicationAdminSocialMediaAccount(BaseModel):
    id: UUID
    platform: str
    account_id: str

    model_config = ConfigDict(from_attributes=True)


class CareerApplicationAdminFamilyMember(BaseModel):
    id: UUID
    relationship: str
    name: str
    education_level: str | None
    occupation: str | None
    workplace: str | None

    model_config = ConfigDict(from_attributes=True)


class CareerApplicationAdminOrganizationExperience(BaseModel):
    id: UUID
    organization_name: str
    position: str | None
    period: str | None

    model_config = ConfigDict(from_attributes=True)


class CareerApplicationAdminComment(BaseModel):
    id: UUID
    admin_user_id: UUID | None
    author_name: str | None
    author_email: str | None
    comment: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CareerApplicationAdminSummary(BaseModel):
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

    model_config = ConfigDict(from_attributes=True)


class CareerApplicationAdmin(CareerApplicationAdminSummary):
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
    social_media_accounts: list[CareerApplicationAdminSocialMediaAccount]
    family_members: list[CareerApplicationAdminFamilyMember]
    organization_experiences: list[CareerApplicationAdminOrganizationExperience]
    work_experiences: list[CareerApplicationAdminWorkExperience]
    comments: list[CareerApplicationAdminComment]


class CareerApplicationStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=50)


class CareerApplicationCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=5000)


class ContactSubmissionCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=3, max_length=150)
    phone_number: str | None = Field(default=None, max_length=30)
    company_name: str | None = Field(default=None, max_length=150)
    message: str = Field(min_length=1, max_length=2000)


class CareerApplicationWorkExperienceCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=150)
    position: str | None = Field(default=None, max_length=100)
    employment_duration: str | None = Field(default=None, max_length=100)
    salary: Decimal | None = Field(default=None, ge=0)
    company_phone_number: str | None = Field(default=None, max_length=30)
    leaving_reason: str | None = None
    company_comment: str | None = None


class CareerApplicationSocialMediaAccountCreate(BaseModel):
    platform: str = Field(min_length=1, max_length=50)
    account_id: str = Field(min_length=1, max_length=150)


class CareerApplicationFamilyMemberCreate(BaseModel):
    relationship: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    education_level: str | None = Field(default=None, max_length=100)
    occupation: str | None = Field(default=None, max_length=150)
    workplace: str | None = Field(default=None, max_length=150)


class CareerApplicationOrganizationExperienceCreate(BaseModel):
    organization_name: str = Field(min_length=1, max_length=150)
    position: str | None = Field(default=None, max_length=100)
    period: str | None = Field(default=None, max_length=100)


class CareerApplicationCreate(BaseModel):
    career_job_slug: str | None = Field(default=None, max_length=150)
    full_name: str = Field(min_length=1, max_length=150)
    nickname: str = Field(min_length=1, max_length=100)
    identity_number: str = Field(min_length=1, max_length=32)
    identity_valid_until: date
    identity_address: str = Field(min_length=1)
    domicile_address: str = Field(min_length=1)
    driving_license_number: str = Field(min_length=1, max_length=32)
    driving_license_class: str | None = Field(default=None, max_length=20)
    driving_license_valid_until: date
    birth_place: str = Field(min_length=1, max_length=100)
    birth_date: date
    age: int = Field(ge=15, le=80)
    marital_status: str | None = Field(default=None, max_length=50)
    gender: str | None = Field(default=None, max_length=30)
    mother_name: str = Field(min_length=1, max_length=150)
    religion: str | None = Field(default=None, max_length=50)
    phone_number: str = Field(min_length=1, max_length=30)
    medical_history: str | None = None
    education_level: str | None = Field(default=None, max_length=100)
    school_name: str | None = Field(default=None, max_length=150)
    major: str | None = Field(default=None, max_length=150)
    school_entry_year: int | None = Field(default=None, ge=1950, le=2100)
    school_graduation_year: int | None = Field(default=None, ge=1950, le=2100)
    school_address: str | None = None
    grade_point_average: str | None = Field(default=None, max_length=30)
    applied_position: str = Field(min_length=1, max_length=100)
    alternative_applied_position: str | None = Field(default=None, max_length=100)
    vacancy_source: str = Field(min_length=1, max_length=100)
    preferred_area: str | None = Field(default=None, max_length=100)
    willing_to_be_placed_anywhere: bool
    available_interview_date: date | None = None
    interview_invitation_reason: str = Field(min_length=1)
    self_photo_url: str | None = Field(default=None, max_length=255)
    cv_file_url: str | None = Field(default=None, max_length=255)
    social_media_accounts: list[CareerApplicationSocialMediaAccountCreate] = Field(
        min_length=1,
        max_length=5,
    )
    family_members: list[CareerApplicationFamilyMemberCreate] = Field(
        min_length=1,
        max_length=6,
    )
    organization_experiences: list[
        CareerApplicationOrganizationExperienceCreate
    ] = Field(
        default_factory=list,
        max_length=5,
    )
    work_experiences: list[CareerApplicationWorkExperienceCreate] = Field(
        default_factory=list,
        max_length=5,
    )


class SubmissionReceipt(BaseModel):
    id: UUID
    status: str
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)
