from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from app.core.api_response import api_response
from app.schemas.common import ApiResponse
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

router = APIRouter(tags=["EXTL v1"])


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
    payload: CareerApplicationCreate,
    recruitment_service: Annotated[
        RecruitmentService,
        Depends(get_recruitment_service),
    ],
) -> dict[str, object]:
    if payload.career_job_slug is not None:
        job = recruitment_service.get_job_by_slug(payload.career_job_slug)
        if job is None:
            raise HTTPException(status_code=404, detail="Career job not found")

    receipt = recruitment_service.create_career_application(payload)
    return api_response(data=receipt, message="Career application submitted")
