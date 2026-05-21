from app.repositories.public_content import PublicContentRepository
from app.schemas.public_content import FAQ, PublicService


class PublicContentService:
    def __init__(self, repository: PublicContentRepository) -> None:
        self._repository = repository

    def list_services(self) -> list[PublicService]:
        return [
            PublicService.model_validate(service)
            for service in self._repository.list_services()
        ]

    def list_faqs(self) -> list[FAQ]:
        return [FAQ.model_validate(faq) for faq in self._repository.list_faqs()]


def get_public_content_service() -> PublicContentService:
    return PublicContentService(PublicContentRepository())
