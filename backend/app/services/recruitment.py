from collections.abc import AsyncIterator
from uuid import UUID

from fastapi import HTTPException
from fastapi import status

from app.core.config import settings
from app.db.session import get_session_factory
from app.repositories.recruitment import DatabaseRecruitmentRepository
from app.repositories.recruitment import RecruitmentRepository
from app.schemas.recruitment import CareerApplicationCreate
from app.schemas.recruitment import CareerJob
from app.schemas.recruitment import CareerJobAdmin
from app.schemas.recruitment import ContactSubmissionCreate
from app.schemas.recruitment import Division
from app.schemas.recruitment import DivisionAdmin
from app.schemas.recruitment import PositionAdmin
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

    def list_admin_divisions(self) -> list[DivisionAdmin]:
        repository = self._database_repository()
        return [
            DivisionAdmin.model_validate(division)
            for division in repository.list_admin_divisions()
        ]

    def create_division(
        self,
        *,
        code: str,
        name: str,
        sort_order: int,
        is_active: bool,
    ) -> DivisionAdmin:
        repository = self._database_repository()
        normalized_code = _clean_required_text(code, "code").upper()
        if repository.get_division_by_code(normalized_code) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A division with this code already exists.",
            )
        division = repository.create_division(
            code=normalized_code,
            name=_clean_required_text(name, "name"),
            sort_order=sort_order,
            is_active=is_active,
        )
        return DivisionAdmin.model_validate(division)

    def update_division(
        self,
        *,
        division_id: UUID,
        name: str | None,
        sort_order: int | None,
        is_active: bool | None,
    ) -> DivisionAdmin:
        repository = self._database_repository()
        division = repository.get_division(division_id)
        if division is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Division was not found.",
            )
        updated_division = repository.update_division(
            division,
            name=_clean_required_text(name, "name") if name is not None else None,
            sort_order=sort_order,
            is_active=is_active,
        )
        return DivisionAdmin.model_validate(updated_division)

    def delete_division(self, *, division_id: UUID) -> None:
        repository = self._database_repository()
        division = repository.get_division(division_id)
        if division is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Division was not found.",
            )
        repository.delete_division(division)

    def list_admin_positions(self) -> list[PositionAdmin]:
        repository = self._database_repository()
        return [
            PositionAdmin.model_validate(position)
            for position in repository.list_admin_positions()
        ]

    def create_position(
        self,
        *,
        division_id: UUID,
        code: str,
        name: str,
        sort_order: int,
        is_active: bool,
    ) -> PositionAdmin:
        repository = self._database_repository()
        division = repository.get_division(division_id)
        if division is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Division was not found.",
            )
        normalized_code = _clean_required_text(code, "code").upper()
        if (
            repository.get_position_by_division_and_code(
                division_id=division.id,
                code=normalized_code,
            )
            is not None
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A position with this code already exists in the division.",
            )
        position = repository.create_position(
            division=division,
            code=normalized_code,
            name=_clean_required_text(name, "name"),
            sort_order=sort_order,
            is_active=is_active,
        )
        return PositionAdmin.model_validate(position)

    def update_position(
        self,
        *,
        position_id: UUID,
        division_id: UUID | None,
        name: str | None,
        sort_order: int | None,
        is_active: bool | None,
    ) -> PositionAdmin:
        repository = self._database_repository()
        position = repository.get_position(position_id)
        if position is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Position was not found.",
            )

        division = None
        if division_id is not None:
            division = repository.get_division(division_id)
            if division is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Division was not found.",
                )
            existing_position = repository.get_position_by_division_and_code(
                division_id=division.id,
                code=position.code,
            )
            if existing_position is not None and existing_position.id != position.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A position with this code already exists in the division.",
                )

        updated_position = repository.update_position(
            position,
            division=division,
            name=_clean_required_text(name, "name") if name is not None else None,
            sort_order=sort_order,
            is_active=is_active,
        )
        return PositionAdmin.model_validate(updated_position)

    def delete_position(self, *, position_id: UUID) -> None:
        repository = self._database_repository()
        position = repository.get_position(position_id)
        if position is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Position was not found.",
            )
        repository.delete_position(position)

    def list_jobs(self) -> list[CareerJob]:
        return [CareerJob.model_validate(job) for job in self._repository.list_jobs()]

    def list_admin_jobs(self) -> list[CareerJobAdmin]:
        repository = self._database_repository()
        return [CareerJobAdmin.model_validate(job) for job in repository.list_admin_jobs()]

    def get_job_by_slug(self, slug: str) -> CareerJob | None:
        job = self._repository.get_job_by_slug(slug)
        if job is None:
            return None
        return CareerJob.model_validate(job)

    def create_job(
        self,
        *,
        code: str,
        slug: str,
        title: str,
        division_id: UUID,
        position_id: UUID,
        location: str,
        employment_type: str,
        summary: str,
        responsibilities: list[str],
        requirements: list[str],
        sort_order: int,
        is_active: bool,
    ) -> CareerJobAdmin:
        repository = self._database_repository()
        normalized_code = _clean_required_text(code, "code").upper()
        normalized_slug = _clean_slug(slug)
        if repository.get_job_by_code(normalized_code) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A job with this code already exists.",
            )
        if repository.get_admin_job_by_slug(normalized_slug) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A job with this slug already exists.",
            )
        division = repository.get_division(division_id)
        if division is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Division was not found.",
            )
        position = repository.get_position(position_id)
        if position is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Position was not found.",
            )
        if position.division_id != division.id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Position must belong to the selected division.",
            )
        job = repository.create_job(
            division=division,
            position=position,
            code=normalized_code,
            slug=normalized_slug,
            title=_clean_required_text(title, "title"),
            location=_clean_required_text(location, "location"),
            employment_type=_clean_required_text(employment_type, "employment_type"),
            summary=_clean_required_text(summary, "summary"),
            responsibilities=_clean_required_list(responsibilities, "responsibilities"),
            requirements=_clean_required_list(requirements, "requirements"),
            sort_order=sort_order,
            is_active=is_active,
        )
        return CareerJobAdmin.model_validate(job)

    def update_job(
        self,
        *,
        job_id: UUID,
        slug: str | None,
        title: str | None,
        division_id: UUID | None,
        position_id: UUID | None,
        location: str | None,
        employment_type: str | None,
        summary: str | None,
        responsibilities: list[str] | None,
        requirements: list[str] | None,
        sort_order: int | None,
        is_active: bool | None,
    ) -> CareerJobAdmin:
        repository = self._database_repository()
        job = repository.get_job(job_id)
        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job was not found.",
            )
        normalized_slug = _clean_slug(slug) if slug is not None else None
        if normalized_slug is not None:
            existing_job = repository.get_admin_job_by_slug(normalized_slug)
            if existing_job is not None and existing_job.id != job.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A job with this slug already exists.",
                )

        division = None
        if division_id is not None:
            division = repository.get_division(division_id)
            if division is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Division was not found.",
                )

        position = None
        if position_id is not None:
            position = repository.get_position(position_id)
            if position is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Position was not found.",
                )

        target_division_id = division.id if division is not None else job.division_id
        target_position = position
        if target_position is None and job.position_id is not None:
            target_position = repository.get_position(job.position_id)
        if target_position is not None and target_division_id is not None:
            if target_position.division_id != target_division_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Position must belong to the selected division.",
                )

        updated_job = repository.update_job(
            job,
            division=division,
            position=position,
            slug=normalized_slug,
            title=_clean_required_text(title, "title") if title is not None else None,
            location=(
                _clean_required_text(location, "location")
                if location is not None
                else None
            ),
            employment_type=(
                _clean_required_text(employment_type, "employment_type")
                if employment_type is not None
                else None
            ),
            summary=(
                _clean_required_text(summary, "summary")
                if summary is not None
                else None
            ),
            responsibilities=(
                _clean_required_list(responsibilities, "responsibilities")
                if responsibilities is not None
                else None
            ),
            requirements=(
                _clean_required_list(requirements, "requirements")
                if requirements is not None
                else None
            ),
            sort_order=sort_order,
            is_active=is_active,
        )
        return CareerJobAdmin.model_validate(updated_job)

    def delete_job(self, *, job_id: UUID) -> None:
        repository = self._database_repository()
        job = repository.get_job(job_id)
        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job was not found.",
            )
        repository.delete_job(job)

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

    def _database_repository(self) -> DatabaseRecruitmentRepository:
        if not isinstance(self._repository, DatabaseRecruitmentRepository):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database-backed recruitment management is unavailable.",
            )
        return self._repository


async def get_recruitment_service() -> AsyncIterator[RecruitmentService]:
    if not settings.database_url:
        yield RecruitmentService(RecruitmentRepository())
        return

    session_factory = get_session_factory()
    with session_factory() as session:
        yield RecruitmentService(DatabaseRecruitmentRepository(session))


async def get_admin_recruitment_service() -> AsyncIterator[RecruitmentService]:
    session_factory = get_session_factory()
    with session_factory() as session:
        yield RecruitmentService(DatabaseRecruitmentRepository(session))


def _clean_required_text(value: str, field_name: str) -> str:
    cleaned_value = value.strip()
    if not cleaned_value:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} is required.",
        )
    return cleaned_value


def _clean_slug(value: str) -> str:
    return _clean_required_text(value, "slug").lower()


def _clean_required_list(value: list[str], field_name: str) -> list[str]:
    cleaned_values = [item.strip() for item in value if item.strip()]
    if not cleaned_values:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must include at least one item.",
        )
    return cleaned_values
