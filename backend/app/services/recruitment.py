from collections.abc import AsyncIterator

from app.core.config import settings
from app.db.session import get_session_factory
from app.repositories.recruitment import DatabaseRecruitmentRepository
from app.repositories.recruitment import RecruitmentRepository
from app.schemas.recruitment import CareerApplicationCreate
from app.schemas.recruitment import CareerJob
from app.schemas.recruitment import ContactSubmissionCreate
from app.schemas.recruitment import Division
from app.schemas.recruitment import SubmissionReceipt


class RecruitmentService:
    def __init__(
        self,
        repository: RecruitmentRepository | DatabaseRecruitmentRepository,
    ) -> None:
        self._repository = repository

    def list_divisions(self) -> list[Division]:
        return [
            Division.model_validate(division)
            for division in self._repository.list_divisions()
        ]

    def list_jobs(self) -> list[CareerJob]:
        return [CareerJob.model_validate(job) for job in self._repository.list_jobs()]

    def get_job_by_slug(self, slug: str) -> CareerJob | None:
        job = self._repository.get_job_by_slug(slug)
        if job is None:
            return None
        return CareerJob.model_validate(job)

    def create_contact_submission(
        self,
        payload: ContactSubmissionCreate,
    ) -> SubmissionReceipt:
        receipt = self._repository.create_contact_submission(
            payload.model_dump()
        )
        return SubmissionReceipt.model_validate(receipt)

    def create_career_application(
        self,
        payload: CareerApplicationCreate,
    ) -> SubmissionReceipt:
        receipt = self._repository.create_career_application(
            payload.model_dump()
        )
        return SubmissionReceipt.model_validate(receipt)


async def get_recruitment_service() -> AsyncIterator[RecruitmentService]:
    if not settings.database_url:
        yield RecruitmentService(RecruitmentRepository())
        return

    session_factory = get_session_factory()
    with session_factory() as session:
        yield RecruitmentService(DatabaseRecruitmentRepository(session))
