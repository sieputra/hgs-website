from collections.abc import Callable
from uuid import UUID

from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer

from app.core.security import decode_access_token
from app.db.session import get_session_factory
from app.models import AdminUserModel
from app.repositories.admin import AdminRepository
from app.services.admin import AdminService
from app.services.admin import has_permission


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AdminUserModel:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication is required.",
        )

    payload = decode_access_token(credentials.credentials)
    subject = payload.get("sub")
    try:
        user_id = UUID(str(subject))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin session.",
        ) from exc

    session_factory = get_session_factory()
    with session_factory() as session:
        service = AdminService(AdminRepository(session))
        return service.get_active_user(user_id)


def require_permission(permission: str) -> Callable[[], AdminUserModel]:
    async def dependency(
        current_user: AdminUserModel = Depends(get_current_admin_user),
    ) -> AdminUserModel:
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your admin role cannot perform this action.",
            )
        return current_user

    return dependency
