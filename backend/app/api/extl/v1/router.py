from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.api_response import api_response
from app.schemas.common import ApiResponse
from app.schemas.public_content import FAQ, PublicService
from app.services.public_content import (
    PublicContentService,
    get_public_content_service,
)

router = APIRouter(tags=["EXTL v1"])


@router.get("/health", response_model=ApiResponse[dict[str, str]])
def health_check() -> dict[str, object]:
    return api_response(data={"status": "ok"}, message="EXTL API is healthy")


@router.get("/services", response_model=ApiResponse[list[PublicService]])
def list_services(
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_public_content_service),
    ],
) -> dict[str, object]:
    services = public_content_service.list_services()
    return api_response(data=services, meta={"total": len(services)})


@router.get("/faqs", response_model=ApiResponse[list[FAQ]])
def list_faqs(
    public_content_service: Annotated[
        PublicContentService,
        Depends(get_public_content_service),
    ],
) -> dict[str, object]:
    faqs = public_content_service.list_faqs()
    return api_response(data=faqs, meta={"total": len(faqs)})
