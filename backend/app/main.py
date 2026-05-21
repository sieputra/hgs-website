from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.extl.v1.router import router as extl_v1_router
from app.api.intl.v1.router import router as intl_v1_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.app_debug,
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(extl_v1_router, prefix=f"{settings.api_prefix}/extl/v1")
    app.include_router(intl_v1_router, prefix=f"{settings.api_prefix}/intl/v1")

    return app


app = create_app()
