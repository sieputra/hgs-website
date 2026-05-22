from collections.abc import AsyncIterator

from app.core.config import settings
from app.db.session import get_session_factory
from app.repositories.public_content import DatabasePublicContentRepository
from app.repositories.public_content import PublicContentRepository
from app.schemas.public_content import FAQ, PublicService


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


async def get_public_content_service() -> AsyncIterator[PublicContentService]:
    if not settings.database_url:
        yield PublicContentService(PublicContentRepository())
        return

    session_factory = get_session_factory()
    with session_factory() as session:
        yield PublicContentService(DatabasePublicContentRepository(session))
