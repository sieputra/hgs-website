from collections.abc import AsyncIterator
from uuid import UUID

from fastapi import HTTPException
from fastapi import status

from app.core.config import settings
from app.db.session import get_session_factory
from app.repositories.public_content import DatabasePublicContentRepository
from app.repositories.public_content import PublicContentRepository
from app.schemas.public_content import FAQ
from app.schemas.public_content import FAQAdmin
from app.schemas.public_content import PublicService
from app.schemas.public_content import PublicServiceAdmin


class PublicContentService:
    def __init__(
        self,
        repository: PublicContentRepository | DatabasePublicContentRepository,
    ) -> None:
        self._repository = repository

    def list_services(self) -> list[PublicService]:
        return [
            PublicService.model_validate(service)
            for service in self._repository.list_services()
        ]

    def list_faqs(self) -> list[FAQ]:
        return [FAQ.model_validate(faq) for faq in self._repository.list_faqs()]

    def list_admin_services(self) -> list[PublicServiceAdmin]:
        repository = self._database_repository()
        return [
            PublicServiceAdmin.model_validate(service)
            for service in repository.list_admin_services()
        ]

    def create_service(
        self,
        *,
        code: str,
        title: str,
        summary: str,
        sort_order: int,
        is_active: bool,
    ) -> PublicServiceAdmin:
        repository = self._database_repository()
        normalized_code = _clean_required_text(code, "code").upper()
        if repository.get_service_by_code(normalized_code) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A service with this code already exists.",
            )
        service = repository.create_service(
            code=normalized_code,
            title=_clean_required_text(title, "title"),
            summary=_clean_required_text(summary, "summary"),
            sort_order=sort_order,
            is_active=is_active,
        )
        return PublicServiceAdmin.model_validate(service)

    def update_service(
        self,
        *,
        service_id: UUID,
        title: str | None,
        summary: str | None,
        sort_order: int | None,
        is_active: bool | None,
    ) -> PublicServiceAdmin:
        repository = self._database_repository()
        service = repository.get_service(service_id)
        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service was not found.",
            )
        updated_service = repository.update_service(
            service,
            title=_clean_required_text(title, "title") if title is not None else None,
            summary=(
                _clean_required_text(summary, "summary")
                if summary is not None
                else None
            ),
            sort_order=sort_order,
            is_active=is_active,
        )
        return PublicServiceAdmin.model_validate(updated_service)

    def delete_service(self, *, service_id: UUID) -> None:
        repository = self._database_repository()
        service = repository.get_service(service_id)
        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service was not found.",
            )
        repository.delete_service(service)

    def list_admin_faqs(self) -> list[FAQAdmin]:
        repository = self._database_repository()
        return [FAQAdmin.model_validate(faq) for faq in repository.list_admin_faqs()]

    def create_faq(
        self,
        *,
        code: str,
        question: str,
        answer: str,
        sort_order: int,
        is_active: bool,
    ) -> FAQAdmin:
        repository = self._database_repository()
        normalized_code = _clean_required_text(code, "code").upper()
        if repository.get_faq_by_code(normalized_code) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A FAQ with this code already exists.",
            )
        faq = repository.create_faq(
            code=normalized_code,
            question=_clean_required_text(question, "question"),
            answer=_clean_required_text(answer, "answer"),
            sort_order=sort_order,
            is_active=is_active,
        )
        return FAQAdmin.model_validate(faq)

    def update_faq(
        self,
        *,
        faq_id: UUID,
        question: str | None,
        answer: str | None,
        sort_order: int | None,
        is_active: bool | None,
    ) -> FAQAdmin:
        repository = self._database_repository()
        faq = repository.get_faq(faq_id)
        if faq is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="FAQ was not found.",
            )
        updated_faq = repository.update_faq(
            faq,
            question=(
                _clean_required_text(question, "question")
                if question is not None
                else None
            ),
            answer=(
                _clean_required_text(answer, "answer")
                if answer is not None
                else None
            ),
            sort_order=sort_order,
            is_active=is_active,
        )
        return FAQAdmin.model_validate(updated_faq)

    def delete_faq(self, *, faq_id: UUID) -> None:
        repository = self._database_repository()
        faq = repository.get_faq(faq_id)
        if faq is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="FAQ was not found.",
            )
        repository.delete_faq(faq)

    def _database_repository(self) -> DatabasePublicContentRepository:
        if not isinstance(self._repository, DatabasePublicContentRepository):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database-backed public content management is unavailable.",
            )
        return self._repository


async def get_public_content_service() -> AsyncIterator[PublicContentService]:
    if not settings.database_url:
        yield PublicContentService(PublicContentRepository())
        return

    session_factory = get_session_factory()
    with session_factory() as session:
        yield PublicContentService(DatabasePublicContentRepository(session))


async def get_admin_public_content_service() -> AsyncIterator[PublicContentService]:
    session_factory = get_session_factory()
    with session_factory() as session:
        yield PublicContentService(DatabasePublicContentRepository(session))


def _clean_required_text(value: str, field_name: str) -> str:
    cleaned_value = value.strip()
    if not cleaned_value:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} is required.",
        )
    return cleaned_value
