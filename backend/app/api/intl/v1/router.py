from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from starlette.datastructures import UploadFile

from app.core.api_response import api_response
from app.schemas.common import ApiResponse
from app.schemas.gallery import GalleryImageAdmin
from app.services.gallery import GalleryService
from app.services.gallery import get_gallery_service

router = APIRouter(tags=["INTL v1"])


@router.get("/health", response_model=ApiResponse[dict[str, str]])
async def health_check() -> dict[str, object]:
    return api_response(data={"status": "ok"}, message="INTL API is healthy")


@router.get(
    "/admin/gallery/images",
    response_model=ApiResponse[list[GalleryImageAdmin]],
)
async def list_admin_gallery_images(
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
