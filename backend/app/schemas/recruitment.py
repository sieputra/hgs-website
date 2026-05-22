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
    applied_position: str = Field(min_length=1, max_length=100)
    vacancy_source: str = Field(min_length=1, max_length=100)
    preferred_area: str | None = Field(default=None, max_length=100)
    willing_to_be_placed_anywhere: bool
    available_interview_date: date | None = None
    interview_invitation_reason: str = Field(min_length=1)
    work_experiences: list[CareerApplicationWorkExperienceCreate] = Field(
        default_factory=list,
        max_length=5,
    )


class SubmissionReceipt(BaseModel):
    id: UUID
    status: str
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)
