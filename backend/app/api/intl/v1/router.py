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
from app.schemas.public_content import FAQAdmin
from app.schemas.public_content import FAQCreate
from app.schemas.public_content import FAQUpdate
from app.schemas.public_content import PublicServiceAdmin
from app.schemas.public_content import PublicServiceCreate
from app.schemas.public_content import PublicServiceUpdate
from app.services.admin import AdminService
from app.services.admin import get_admin_service
from app.services.gallery import GalleryService
from app.services.gallery import get_gallery_service
from app.services.public_content import PublicContentService
from app.services.public_content import get_admin_public_content_service

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
    "/roles",
    response_model=ApiResponse[list[AdminRole]],
)
async def list_admin_roles(
    _: Annotated[AdminUser, Depends(require_permission("role.read"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    roles = admin_service.list_roles()
    return api_response(data=roles, meta={"total": len(roles)})


@router.post(
    "/roles",
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
    "/roles/{role_id}",
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
    "/roles/{role_id}",
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
    "/users",
    response_model=ApiResponse[list[AdminUser]],
)
async def list_admin_users(
    _: Annotated[AdminUser, Depends(require_permission("user.read"))],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> dict[str, object]:
    users = admin_service.list_users()
    return api_response(data=users, meta={"total": len(users)})


@router.post(
    "/users",
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
    "/users/{user_id}",
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
    "/users/{user_id}",
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
    "/services",
    response_model=ApiResponse[list[PublicServiceAdmin]],
)
async def list_admin_services(
    _: Annotated[AdminUser, Depends(require_permission("service.read"))],
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_admin_public_content_service),
    ],
) -> dict[str, object]:
    services = public_content_service.list_admin_services()
    return api_response(data=services, meta={"total": len(services)})


@router.post(
    "/services",
    response_model=ApiResponse[PublicServiceAdmin],
    status_code=201,
)
async def create_admin_service(
    payload: PublicServiceCreate,
    _: Annotated[AdminUser, Depends(require_permission("service.create"))],
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_admin_public_content_service),
    ],
) -> dict[str, object]:
    service = public_content_service.create_service(
        code=payload.code,
        title=payload.title,
        summary=payload.summary,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    return api_response(data=service, message="Service created")


@router.patch(
    "/services/{service_id}",
    response_model=ApiResponse[PublicServiceAdmin],
)
async def update_admin_service(
    service_id: UUID,
    payload: PublicServiceUpdate,
    _: Annotated[AdminUser, Depends(require_permission("service.update"))],
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_admin_public_content_service),
    ],
) -> dict[str, object]:
    service = public_content_service.update_service(
        service_id=service_id,
        title=payload.title,
        summary=payload.summary,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    return api_response(data=service, message="Service updated")


@router.delete(
    "/services/{service_id}",
    response_model=ApiResponse[dict[str, str]],
)
async def delete_admin_service(
    service_id: UUID,
    _: Annotated[AdminUser, Depends(require_permission("service.delete"))],
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_admin_public_content_service),
    ],
) -> dict[str, object]:
    public_content_service.delete_service(service_id=service_id)
    return api_response(data={"id": str(service_id)}, message="Service deleted")


@router.get(
    "/faqs",
    response_model=ApiResponse[list[FAQAdmin]],
)
async def list_admin_faqs(
    _: Annotated[AdminUser, Depends(require_permission("faq.read"))],
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_admin_public_content_service),
    ],
) -> dict[str, object]:
    faqs = public_content_service.list_admin_faqs()
    return api_response(data=faqs, meta={"total": len(faqs)})


@router.post(
    "/faqs",
    response_model=ApiResponse[FAQAdmin],
    status_code=201,
)
async def create_admin_faq(
    payload: FAQCreate,
    _: Annotated[AdminUser, Depends(require_permission("faq.create"))],
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_admin_public_content_service),
    ],
) -> dict[str, object]:
    faq = public_content_service.create_faq(
        code=payload.code,
        question=payload.question,
        answer=payload.answer,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    return api_response(data=faq, message="FAQ created")


@router.patch(
    "/faqs/{faq_id}",
    response_model=ApiResponse[FAQAdmin],
)
async def update_admin_faq(
    faq_id: UUID,
    payload: FAQUpdate,
    _: Annotated[AdminUser, Depends(require_permission("faq.update"))],
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_admin_public_content_service),
    ],
) -> dict[str, object]:
    faq = public_content_service.update_faq(
        faq_id=faq_id,
        question=payload.question,
        answer=payload.answer,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    return api_response(data=faq, message="FAQ updated")


@router.delete(
    "/faqs/{faq_id}",
    response_model=ApiResponse[dict[str, str]],
)
async def delete_admin_faq(
    faq_id: UUID,
    _: Annotated[AdminUser, Depends(require_permission("faq.delete"))],
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_admin_public_content_service),
    ],
) -> dict[str, object]:
    public_content_service.delete_faq(faq_id=faq_id)
    return api_response(data={"id": str(faq_id)}, message="FAQ deleted")


@router.get(
    "/gallery/images",
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
    "/gallery/images",
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


@router.patch(
    "/gallery/images/{image_id}",
    response_model=ApiResponse[GalleryImageAdmin],
)
async def update_admin_gallery_image(
    image_id: UUID,
    request: Request,
    _: Annotated[AdminUser, Depends(require_permission("gallery.update"))],
    gallery_service: Annotated[
        GalleryService,
        Depends(get_gallery_service),
    ],
) -> dict[str, object]:
    form = await request.form()
    upload_value = form.get("image")
    upload = upload_value if isinstance(upload_value, UploadFile) else None
    image = await gallery_service.update_image(
        image_id=image_id,
        upload=upload,
        title=_optional_update_form_text(form.get("title"), "title"),
        caption=_optional_update_form_text(form.get("caption"), "caption"),
        image_alt=_optional_form_text_or_blank(form.get("image_alt")),
        sort_order=_optional_form_int(form.get("sort_order"), "sort_order"),
        is_active=_optional_form_bool_or_none(form.get("is_active")),
    )
    return api_response(data=image, message="Gallery image updated")


@router.delete("/gallery/images/{image_id}", response_model=ApiResponse[dict[str, str]])
async def delete_admin_gallery_image(
    image_id: UUID,
    _: Annotated[AdminUser, Depends(require_permission("gallery.delete"))],
    gallery_service: Annotated[
        GalleryService,
        Depends(get_gallery_service),
    ],
) -> dict[str, object]:
    gallery_service.delete_image(image_id=image_id)
    return api_response(data={"id": str(image_id)}, message="Gallery image deleted")


def _required_form_text(value: object, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(status_code=422, detail=f"{field_name} is required.")
    return value.strip()


def _optional_update_form_text(value: object, field_name: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(status_code=422, detail=f"{field_name} is required.")
    return value.strip()


def _optional_form_text(value: object) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip()


def _optional_form_text_or_blank(value: object) -> str | None:
    if not isinstance(value, str):
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


def _optional_form_bool_or_none(value: object) -> bool | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip().lower() in {"1", "true", "yes", "on"}
