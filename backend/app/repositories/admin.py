from uuid import UUID

from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.models import AdminRoleModel
from app.models import AdminUserModel


class AdminRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_roles(self) -> list[AdminRoleModel]:
        return list(
            self._session.scalars(
                select(AdminRoleModel).order_by(AdminRoleModel.name)
            )
        )

    def get_role_by_code(self, role_code: str) -> AdminRoleModel | None:
        return self._session.scalar(
            select(AdminRoleModel).where(AdminRoleModel.code == role_code)
        )

    def get_role(self, role_id: UUID) -> AdminRoleModel | None:
        return self._session.get(AdminRoleModel, role_id)

    def create_role(
        self,
        *,
        code: str,
        name: str,
        description: str | None,
        permissions: list[str],
    ) -> AdminRoleModel:
        role = AdminRoleModel(
            code=code,
            name=name,
            description=description,
            permissions=permissions,
            is_system=False,
        )
        self._session.add(role)
        self._session.commit()
        self._session.refresh(role)
        return role

    def update_role(
        self,
        role: AdminRoleModel,
        *,
        name: str | None = None,
        description: str | None = None,
        permissions: list[str] | None = None,
    ) -> AdminRoleModel:
        if name is not None:
            role.name = name
        if description is not None:
            role.description = description
        if permissions is not None:
            role.permissions = permissions
        self._session.commit()
        self._session.refresh(role)
        return role

    def count_users_by_role(self, role: AdminRoleModel) -> int:
        return int(
            self._session.scalar(
                select(func.count(AdminUserModel.id)).where(
                    AdminUserModel.role_id == role.id
                )
            )
            or 0
        )

    def delete_role(self, role: AdminRoleModel) -> None:
        self._session.delete(role)
        self._session.commit()

    def upsert_role(
        self,
        *,
        code: str,
        name: str,
        description: str,
        permissions: list[str],
    ) -> AdminRoleModel:
        role = self.get_role_by_code(code)
        if role is None:
            role = AdminRoleModel(
                code=code,
                name=name,
                description=description,
                permissions=permissions,
                is_system=True,
            )
            self._session.add(role)
        else:
            role.name = name
            role.description = description
            role.permissions = permissions
            role.is_system = True
        self._session.commit()
        self._session.refresh(role)
        return role

    def list_users(self) -> list[AdminUserModel]:
        return list(
            self._session.scalars(
                select(AdminUserModel)
                .options(selectinload(AdminUserModel.role))
                .order_by(AdminUserModel.created_at.desc())
            )
        )

    def get_user(self, user_id: UUID) -> AdminUserModel | None:
        return self._session.scalar(
            select(AdminUserModel)
            .options(selectinload(AdminUserModel.role))
            .where(AdminUserModel.id == user_id)
        )

    def get_user_by_email(self, email: str) -> AdminUserModel | None:
        return self._session.scalar(
            select(AdminUserModel)
            .options(selectinload(AdminUserModel.role))
            .where(AdminUserModel.email == email.lower())
        )

    def create_user(
        self,
        *,
        email: str,
        full_name: str,
        password_hash: str,
        role: AdminRoleModel,
        is_active: bool,
    ) -> AdminUserModel:
        user = AdminUserModel(
            email=email.lower(),
            full_name=full_name,
            password_hash=password_hash,
            role=role,
            is_active=is_active,
        )
        self._session.add(user)
        self._session.commit()
        self._session.refresh(user)
        return self.get_user(user.id) or user

    def update_user(
        self,
        user: AdminUserModel,
        *,
        full_name: str | None = None,
        role: AdminRoleModel | None = None,
        is_active: bool | None = None,
        password_hash: str | None = None,
    ) -> AdminUserModel:
        if full_name is not None:
            user.full_name = full_name
        if role is not None:
            user.role = role
        if is_active is not None:
            user.is_active = is_active
        if password_hash is not None:
            user.password_hash = password_hash
        self._session.commit()
        self._session.refresh(user)
        return self.get_user(user.id) or user

    def delete_user(self, user: AdminUserModel) -> None:
        self._session.delete(user)
        self._session.commit()

    def mark_login(self, user: AdminUserModel) -> AdminUserModel:
        from datetime import UTC
        from datetime import datetime

        user.last_login_at = datetime.now(UTC)
        self._session.commit()
        self._session.refresh(user)
        return self.get_user(user.id) or user
