from fastapi import APIRouter

from app.core.api_response import api_response
from app.schemas.common import ApiResponse

router = APIRouter(tags=["INTL v1"])


@router.get("/health", response_model=ApiResponse[dict[str, str]])
async def health_check() -> dict[str, object]:
    return api_response(data={"status": "ok"}, message="INTL API is healthy")
