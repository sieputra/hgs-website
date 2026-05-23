from collections.abc import AsyncIterator
from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException
from fastapi import status

from app.core.security import create_access_token
from app.core.security import hash_password
from app.core.security import verify_password
from app.db.session import get_session_factory
from app.models import AdminRoleModel
from app.models import AdminUserModel
from app.repositories.admin import AdminRepository
from app.schemas.admin import AdminLoginResponse
from app.schemas.admin import AdminRole
from app.schemas.admin import AdminUser


@dataclass(frozen=True)
class DefaultRole:
    code: str
    name: str
    description: str
    permissions: list[str]


DEFAULT_ADMIN_ROLES = (
    DefaultRole(
        code="super_admin",
        name="Super Admin",
        description="Full access to every admin function.",
        permissions=["*"],
    ),
    DefaultRole(
        code="admin",
        name="Admin",
        description="Can manage users and operational admin content.",
        permissions=[
            "role.read",
            "role.create",
            "role.update",
            "role.delete",
            "user.read",
            "user.create",
            "user.update",
            "user.delete",
            "service.read",
            "service.create",
            "service.update",
            "service.delete",
            "faq.read",
            "faq.create",
            "faq.update",
            "faq.delete",
            "gallery.read",
            "gallery.create",
            "gallery.update",
            "gallery.delete",
            "recruitment.read",
            "recruitment.update",
            "division.read",
            "division.create",
            "division.update",
            "division.delete",
            "position.read",
            "position.create",
            "position.update",
            "position.delete",
            "job.read",
            "job.create",
            "job.update",
            "job.delete",
        ],
    ),
    DefaultRole(
        code="content_admin",
        name="Content Admin",
        description="Can manage public website content.",
        permissions=[
            "service.read",
            "service.create",
            "service.update",
            "service.delete",
            "faq.read",
            "faq.create",
            "faq.update",
            "faq.delete",
            "gallery.read",
            "gallery.create",
            "gallery.update",
            "gallery.delete",
        ],
    ),
    DefaultRole(
        code="recruitment_admin",
        name="Recruitment Admin",
        description="Can manage recruitment master data and job postings.",
        permissions=[
            "recruitment.read",
            "recruitment.update",
            "division.read",
            "division.create",
            "division.update",
            "division.delete",
            "position.read",
            "position.create",
            "position.update",
            "position.delete",
            "job.read",
            "job.create",
            "job.update",
            "job.delete",
        ],
    ),
)


class AdminService:
    def __init__(self, repository: AdminRepository) -> None:
        self._repository = repository

    def ensure_default_roles(self) -> list[AdminRole]:
        roles = [
            self._repository.upsert_role(
                code=role.code,
                name=role.name,
                description=role.description,
                permissions=role.permissions,
            )
            for role in DEFAULT_ADMIN_ROLES
        ]
        return [AdminRole.model_validate(role) for role in roles]

    def list_roles(self) -> list[AdminRole]:
        return [AdminRole.model_validate(role) for role in self._repository.list_roles()]

    def create_role(
        self,
        *,
        code: str,
        name: str,
        description: str | None,
        permissions: list[str],
    ) -> AdminRole:
        existing_role = self._repository.get_role_by_code(code)
        if existing_role is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An admin role with this code already exists.",
            )
        role = self._repository.create_role(
            code=code,
            name=name,
            description=description,
            permissions=permissions,
        )
        return AdminRole.model_validate(role)

    def update_role(
        self,
        *,
        role_id: UUID,
        name: str | None,
        description: str | None,
        permissions: list[str] | None,
    ) -> AdminRole:
        role = self._repository.get_role(role_id)
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin role was not found.",
            )
        updated_role = self._repository.update_role(
            role,
            name=name,
            description=description,
            permissions=permissions,
        )
        return AdminRole.model_validate(updated_role)

    def delete_role(self, *, role_id: UUID) -> None:
        role = self._repository.get_role(role_id)
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin role was not found.",
            )
        if role.is_system:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System roles cannot be deleted.",
            )
        if self._repository.count_users_by_role(role) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Role cannot be deleted while assigned to admin users.",
            )
        self._repository.delete_role(role)

    def list_users(self) -> list[AdminUser]:
        return [AdminUser.model_validate(user) for user in self._repository.list_users()]

    def get_active_user(self, user_id: UUID) -> AdminUserModel:
        user = self._repository.get_user(user_id)
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin user is not active.",
            )
        return user

    def authenticate(self, *, email: str, password: str) -> AdminLoginResponse:
        user = self._repository.get_user_by_email(email)
        if user is None or not user.is_active:
            raise _invalid_credentials()
        if not verify_password(password, user.password_hash):
            raise _invalid_credentials()

        user = self._repository.mark_login(user)
        token = create_access_token(
            user_id=user.id,
            role_code=user.role.code,
            permissions=user.role.permissions,
        )
        return AdminLoginResponse(
            access_token=token,
            user=AdminUser.model_validate(user),
        )

    def create_user(
        self,
        *,
        email: str,
        full_name: str,
        password: str,
        role_code: str,
        is_active: bool = True,
    ) -> AdminUser:
        role = self._get_role_or_404(role_code)
        existing_user = self._repository.get_user_by_email(email)
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An admin user with this email already exists.",
            )
        user = self._repository.create_user(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role=role,
            is_active=is_active,
        )
        return AdminUser.model_validate(user)

    def update_user(
        self,
        *,
        user_id: UUID,
        full_name: str | None = None,
        role_code: str | None = None,
        is_active: bool | None = None,
        password: str | None = None,
    ) -> AdminUser:
        user = self._repository.get_user(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin user was not found.",
            )
        role = self._get_role_or_404(role_code) if role_code is not None else None
        updated_user = self._repository.update_user(
            user,
            full_name=full_name,
            role=role,
            is_active=is_active,
            password_hash=hash_password(password) if password else None,
        )
        return AdminUser.model_validate(updated_user)

    def delete_user(self, *, user_id: UUID, current_user_id: UUID) -> None:
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delete your own admin account while signed in.",
            )
        user = self._repository.get_user(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin user was not found.",
            )
        self._repository.delete_user(user)

    def _get_role_or_404(self, role_code: str) -> AdminRoleModel:
        role = self._repository.get_role_by_code(role_code)
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin role was not found.",
            )
        return role


async def get_admin_service() -> AsyncIterator[AdminService]:
    session_factory = get_session_factory()
    with session_factory() as session:
        yield AdminService(AdminRepository(session))


def has_permission(user: AdminUserModel, permission: str) -> bool:
    permissions = set(user.role.permissions)
    return "*" in permissions or permission in permissions


def _invalid_credentials() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )
