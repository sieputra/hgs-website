from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field
from pydantic import field_validator


class AdminRole(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None = None
    permissions: list[str]
    is_system: bool

    model_config = ConfigDict(from_attributes=True)


class AdminRoleCreate(BaseModel):
    code: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    permissions: list[str] = Field(min_length=1)

    @field_validator("code", "name", "description", mode="before")
    @classmethod
    def strip_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        code = value.lower()
        if not code.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Role code can only contain letters, numbers, hyphens, and underscores.")
        return code

    @field_validator("permissions")
    @classmethod
    def validate_permissions(cls, value: list[str]) -> list[str]:
        permissions = sorted({permission.strip() for permission in value if permission.strip()})
        if not permissions:
            raise ValueError("At least one permission is required.")
        return permissions


class AdminRoleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    permissions: list[str] | None = None

    @field_validator("name", "description", mode="before")
    @classmethod
    def strip_optional_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("permissions")
    @classmethod
    def validate_optional_permissions(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        permissions = sorted({permission.strip() for permission in value if permission.strip()})
        if not permissions:
            raise ValueError("At least one permission is required.")
        return permissions


class AdminUser(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    role: AdminRole
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=150)
    full_name: str = Field(min_length=2, max_length=150)
    password: str = Field(min_length=12, max_length=128)
    role_code: str = Field(min_length=2, max_length=80)
    is_active: bool = True

    @field_validator("email", "full_name", "role_code", mode="before")
    @classmethod
    def strip_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        email = value.lower()
        if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
            raise ValueError("A valid email address is required.")
        return email


class AdminUserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    role_code: str | None = Field(default=None, min_length=2, max_length=80)
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=12, max_length=128)

    @field_validator("full_name", "role_code", mode="before")
    @classmethod
    def strip_optional_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class AdminLoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminUser
