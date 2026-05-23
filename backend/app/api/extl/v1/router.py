from io import BytesIO
from json import JSONDecodeError
from json import loads
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from pydantic import ValidationError
from starlette.datastructures import UploadFile

from app.core.config import settings
from app.core.api_response import api_response
from app.schemas.common import ApiResponse
from app.schemas.gallery import GalleryImage
from app.schemas.public_content import FAQ, PublicService
from app.schemas.recruitment import CareerApplicationCreate
from app.schemas.recruitment import CareerJob
from app.schemas.recruitment import ContactSubmissionCreate
from app.schemas.recruitment import Division
from app.schemas.recruitment import SubmissionReceipt
from app.services.recruitment import RecruitmentService
from app.services.recruitment import get_recruitment_service
from app.services.public_content import (
    PublicContentService,
    get_public_content_service,
)
from app.services.gallery import GalleryService
from app.services.gallery import get_gallery_service

router = APIRouter(tags=["EXTL v1"])

CAREER_UPLOAD_DIR_NAME = "career-applications"
PHOTO_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
PDF_CONTENT_TYPE = "application/pdf"


@router.get("/health", response_model=ApiResponse[dict[str, str]])
async def health_check() -> dict[str, object]:
    return api_response(data={"status": "ok"}, message="EXTL API is healthy")


@router.get("/services", response_model=ApiResponse[list[PublicService]])
async def list_services(
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_public_content_service),
    ],
) -> dict[str, object]:
    services = public_content_service.list_services()
    return api_response(data=services, meta={"total": len(services)})


@router.get("/faqs", response_model=ApiResponse[list[FAQ]])
async def list_faqs(
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_public_content_service),
    ],
) -> dict[str, object]:
    faqs = public_content_service.list_faqs()
    return api_response(data=faqs, meta={"total": len(faqs)})


@router.get("/gallery/images", response_model=ApiResponse[list[GalleryImage]])
async def list_gallery_images(
    gallery_service: Annotated[
        GalleryService,
        Depends(get_gallery_service),
    ],
) -> dict[str, object]:
    images = gallery_service.list_public_images()
    return api_response(data=images, meta={"total": len(images)})


@router.get("/divisions", response_model=ApiResponse[list[Division]])
async def list_divisions(
    recruitment_service: Annotated[
        RecruitmentService,
        Depends(get_recruitment_service),
    ],
) -> dict[str, object]:
    divisions = recruitment_service.list_divisions()
    return api_response(data=divisions, meta={"total": len(divisions)})


@router.get("/jobs", response_model=ApiResponse[list[CareerJob]])
async def list_jobs(
    recruitment_service: Annotated[
        RecruitmentService,
        Depends(get_recruitment_service),
    ],
) -> dict[str, object]:
    jobs = recruitment_service.list_jobs()
    return api_response(data=jobs, meta={"total": len(jobs)})


@router.get("/jobs/{slug}", response_model=ApiResponse[CareerJob])
async def get_job(
    slug: str,
    recruitment_service: Annotated[
        RecruitmentService,
        Depends(get_recruitment_service),
    ],
) -> dict[str, object]:
    job = recruitment_service.get_job_by_slug(slug)
    if job is None:
        raise HTTPException(status_code=404, detail="Career job not found")
    return api_response(data=job)


@router.post("/contact", response_model=ApiResponse[SubmissionReceipt], status_code=201)
async def create_contact_submission(
    payload: ContactSubmissionCreate,
    recruitment_service: Annotated[
        RecruitmentService,
        Depends(get_recruitment_service),
    ],
) -> dict[str, object]:
    receipt = recruitment_service.create_contact_submission(payload)
    return api_response(data=receipt, message="Contact submission received")


@router.post(
    "/career-applications",
    response_model=ApiResponse[SubmissionReceipt],
    status_code=201,
)
async def create_career_application(
    request: Request,
    recruitment_service: Annotated[
        RecruitmentService,
        Depends(get_recruitment_service),
    ],
) -> dict[str, object]:
    payload = await _career_application_payload_from_request(request)

    if payload.career_job_slug is not None:
        job = recruitment_service.get_job_by_slug(payload.career_job_slug)
        if job is None:
            raise HTTPException(status_code=404, detail="Career job not found")

    receipt = recruitment_service.create_career_application(payload)
    return api_response(data=receipt, message="Career application submitted")


async def _career_application_payload_from_request(
    request: Request,
) -> CareerApplicationCreate:
    content_type = request.headers.get("content-type", "")

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        raw_payload = form.get("payload")
        if not isinstance(raw_payload, str):
            raise HTTPException(
                status_code=422,
                detail="Career application payload is required.",
            )
        try:
            payload_data = loads(raw_payload)
        except JSONDecodeError as exc:
            raise HTTPException(
                status_code=422,
                detail="Career application payload must be valid JSON.",
            ) from exc
        if not isinstance(payload_data, dict):
            raise HTTPException(
                status_code=422,
                detail="Career application payload must be an object.",
            )

        payload = _validate_career_application_payload(payload_data)
        upload_updates: dict[str, str] = {}

        self_photo = form.get("self_photo")
        if isinstance(self_photo, UploadFile):
            upload_updates["self_photo_url"] = await _save_career_upload(
                upload=self_photo,
                field_name="Self photo",
                allowed_content_types=PHOTO_CONTENT_TYPES,
                max_size=settings.max_career_photo_bytes,
                validate_pdf=False,
            )

        cv_file = form.get("cv_file")
        if isinstance(cv_file, UploadFile):
            upload_updates["cv_file_url"] = await _save_career_upload(
                upload=cv_file,
                field_name="CV file",
                allowed_content_types={PDF_CONTENT_TYPE: ".pdf"},
                max_size=settings.max_career_cv_bytes,
                validate_pdf=True,
            )

        if upload_updates:
            return payload.model_copy(update=upload_updates)
        return payload
    else:
        try:
            payload_data = await request.json()
        except JSONDecodeError as exc:
            raise HTTPException(
                status_code=422,
                detail="Career application request body must be valid JSON.",
            ) from exc

    return _validate_career_application_payload(payload_data)


def _validate_career_application_payload(
    payload_data: object,
) -> CareerApplicationCreate:
    try:
        return CareerApplicationCreate.model_validate(payload_data)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc


async def _save_career_upload(
    *,
    upload: UploadFile,
    field_name: str,
    allowed_content_types: dict[str, str],
    max_size: int,
    validate_pdf: bool,
) -> str:
    content_type = (upload.content_type or "").lower()
    suffix = allowed_content_types.get(content_type)
    if suffix is None:
        allowed_labels = ", ".join(sorted(allowed_content_types))
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must use one of these content types: {allowed_labels}.",
        )

    contents = await upload.read()
    if not contents:
        raise HTTPException(status_code=400, detail=f"{field_name} is empty.")
    if len(contents) > max_size:
        raise HTTPException(status_code=413, detail=f"{field_name} is too large.")

    if validate_pdf and not contents.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="CV file must be a valid PDF.")
    if not validate_pdf:
        _verify_photo(contents, field_name)

    upload_root = settings.upload_path / CAREER_UPLOAD_DIR_NAME
    upload_root.mkdir(parents=True, exist_ok=True)
    target_path = upload_root / f"{uuid4()}{suffix}"
    target_path.write_bytes(contents)
    return f"/uploads/{CAREER_UPLOAD_DIR_NAME}/{target_path.name}"


def _verify_photo(contents: bytes, field_name: str) -> None:
    try:
        from PIL import Image
        from PIL import UnidentifiedImageError
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="Image validation dependency is not installed.",
        ) from exc

    try:
        with Image.open(BytesIO(contents)) as image:
            image.verify()
    except (OSError, SyntaxError, UnidentifiedImageError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be a valid image.",
        ) from exc
