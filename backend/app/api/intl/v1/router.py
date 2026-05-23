from typing import Annotated
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from starlette.datastructures import UploadFile

from app.api.intl.v1.dependencies import get_current_admin_user
from app.api.intl.v1.dependencies import require_permission
from app.core.api_response import api_response
from app.schemas.admin import AdminLoginRequest
from app.schemas.admin import AdminLoginResponse
from app.schemas.admin import AdminRole
from app.schemas.admin import AdminRoleCreate
from app.schemas.admin import AdminRoleUpdate
from app.schemas.admin import AdminUser
from app.schemas.admin import AdminUserCreate
from app.schemas.admin import AdminUserUpdate
from app.schemas.common import ApiResponse
from app.schemas.gallery import GalleryImageAdmin
from app.services.admin import AdminService
from app.services.admin import get_admin_service
from app.services.gallery import GalleryService
from app.services.gallery import get_gallery_service

router = APIRouter(tags=["INTL v1"])


@router.get("/health", response_model=ApiResponse[dict[str, str]])
async def health_check() -> dict[str, object]:
    return api_response(data={"status": "ok"}, message="INTL API is healthy")


@router.post(
    "/auth/login",
    response_model=ApiResponse[AdminLoginResponse],
)
async def admin_login(
    payload: AdminLoginRequest,
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    login = admin_service.authenticate(
        email=payload.email,
        password=payload.password,
    )
    return api_response(data=login, message="Admin login successful")


@router.get(
    "/auth/me",
    response_model=ApiResponse[AdminUser],
)
async def get_admin_me(
    current_user: Annotated[AdminUser, Depends(get_current_admin_user)],
) -> dict[str, object]:
    return api_response(data=AdminUser.model_validate(current_user))


@router.get(
    "/admin/roles",
    response_model=ApiResponse[list[AdminRole]],
)
async def list_admin_roles(
    _: Annotated[AdminUser, Depends(require_permission("role.read"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    roles = admin_service.list_roles()
    return api_response(data=roles, meta={"total": len(roles)})


@router.post(
    "/admin/roles",
    response_model=ApiResponse[AdminRole],
    status_code=201,
)
async def create_admin_role(
    payload: AdminRoleCreate,
    _: Annotated[AdminUser, Depends(require_permission("role.create"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    role = admin_service.create_role(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        permissions=payload.permissions,
    )
    return api_response(data=role, message="Admin role created")


@router.patch(
    "/admin/roles/{role_id}",
    response_model=ApiResponse[AdminRole],
)
async def update_admin_role(
    role_id: UUID,
    payload: AdminRoleUpdate,
    _: Annotated[AdminUser, Depends(require_permission("role.update"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    role = admin_service.update_role(
        role_id=role_id,
        name=payload.name,
        description=payload.description,
        permissions=payload.permissions,
    )
    return api_response(data=role, message="Admin role updated")


@router.delete(
    "/admin/roles/{role_id}",
    response_model=ApiResponse[dict[str, str]],
)
async def delete_admin_role(
    role_id: UUID,
    _: Annotated[AdminUser, Depends(require_permission("role.delete"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    admin_service.delete_role(role_id=role_id)
    return api_response(data={"id": str(role_id)}, message="Admin role deleted")


@router.get(
    "/admin/users",
    response_model=ApiResponse[list[AdminUser]],
)
async def list_admin_users(
    _: Annotated[AdminUser, Depends(require_permission("user.read"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    users = admin_service.list_users()
    return api_response(data=users, meta={"total": len(users)})


@router.post(
    "/admin/users",
    response_model=ApiResponse[AdminUser],
    status_code=201,
)
async def create_admin_user(
    payload: AdminUserCreate,
    _: Annotated[AdminUser, Depends(require_permission("user.create"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    user = admin_service.create_user(
        email=payload.email,
        full_name=payload.full_name,
        password=payload.password,
        role_code=payload.role_code,
        is_active=payload.is_active,
    )
    return api_response(data=user, message="Admin user created")


@router.patch(
    "/admin/users/{user_id}",
    response_model=ApiResponse[AdminUser],
)
async def update_admin_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    _: Annotated[AdminUser, Depends(require_permission("user.update"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    user = admin_service.update_user(
        user_id=user_id,
        full_name=payload.full_name,
        role_code=payload.role_code,
        is_active=payload.is_active,
        password=payload.password,
    )
    return api_response(data=user, message="Admin user updated")


@router.delete(
    "/admin/users/{user_id}",
    response_model=ApiResponse[dict[str, str]],
)
async def delete_admin_user(
    user_id: UUID,
    current_user: Annotated[AdminUser, Depends(require_permission("user.delete"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    admin_service.delete_user(user_id=user_id, current_user_id=current_user.id)
    return api_response(data={"id": str(user_id)}, message="Admin user deleted")


@router.get(
    "/admin/gallery/images",
    response_model=ApiResponse[list[GalleryImageAdmin]],
)
async def list_admin_gallery_images(
    _: Annotated[AdminUser, Depends(require_permission("gallery.read"))],
    gallery_service: Annotated[
        GalleryService,
        Depends(get_gallery_service),
    ],
) -> dict[str, object]:
    images = gallery_service.list_admin_images()
    return api_response(data=images, meta={"total": len(images)})


@router.post(
    "/admin/gallery/images",
    response_model=ApiResponse[GalleryImageAdmin],
    status_code=201,
)
async def create_admin_gallery_image(
    request: Request,
    _: Annotated[AdminUser, Depends(require_permission("gallery.create"))],
    gallery_service: Annotated[
        GalleryService,
        Depends(get_gallery_service),
    ],
) -> dict[str, object]:
    form = await request.form()
    upload = form.get("image")
    if not isinstance(upload, UploadFile):
        raise HTTPException(status_code=422, detail="Image file is required.")

    title = _required_form_text(form.get("title"), "title")
    caption = _required_form_text(form.get("caption"), "caption")
    image_alt = _optional_form_text(form.get("image_alt"))
    sort_order = _optional_form_int(form.get("sort_order"), "sort_order")
    is_active = _optional_form_bool(form.get("is_active"), default=True)
    image = await gallery_service.create_image_from_upload(
        upload=upload,
        title=title,
        caption=caption,
        image_alt=image_alt,
        sort_order=sort_order,
        is_active=is_active,
    )
    return api_response(data=image, message="Gallery image uploaded")


def _required_form_text(value: object, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(status_code=422, detail=f"{field_name} is required.")
    return value.strip()


def _optional_form_text(value: object) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip()


def _optional_form_int(value: object, field_name: str) -> int | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return int(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"{field_name} must be an integer.",
        ) from exc


def _optional_form_bool(value: object, *, default: bool) -> bool:
    if not isinstance(value, str) or not value.strip():
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}
