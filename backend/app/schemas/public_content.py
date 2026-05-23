from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field


class PublicService(BaseModel):
    code: str
    title: str
    summary: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class PublicServiceAdmin(PublicService):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PublicServiceCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=150)
    summary: str = Field(min_length=1)
    sort_order: int = Field(ge=0, le=32767)
    is_active: bool = True


class PublicServiceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    summary: str | None = Field(default=None, min_length=1)
    sort_order: int | None = Field(default=None, ge=0, le=32767)
    is_active: bool | None = None


class FAQ(BaseModel):
    code: str
    question: str
    answer: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class FAQAdmin(FAQ):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


class FAQCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)
    sort_order: int = Field(ge=0, le=32767)
    is_active: bool = True


class FAQUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=1)
    answer: str | None = Field(default=None, min_length=1)
    sort_order: int | None = Field(default=None, ge=0, le=32767)
    is_active: bool | None = None
