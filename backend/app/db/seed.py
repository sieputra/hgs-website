from collections.abc import Iterable
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_session_factory
from app.models import CareerJobModel
from app.models import DivisionModel
from app.models import FAQModel
from app.models import PositionModel
from app.models import PublicServiceModel
from app.repositories.public_content import PublicContentRepository
from app.repositories.recruitment import CareerJobRecord
from app.repositories.recruitment import DivisionRecord
from app.repositories.recruitment import RecruitmentRepository


def _upsert_services(session: Session) -> int:
    count = 0
    for service in PublicContentRepository._services:
        values = {
            "code": service.code,
            "title": service.title,
            "summary": service.summary,
            "sort_order": service.sort_order,
            "is_active": service.is_active,
        }
        statement = insert(PublicServiceModel).values(**values)
        session.execute(
            statement.on_conflict_do_update(
                index_elements=[PublicServiceModel.code],
                set_=values,
            )
        )
        count += 1
    return count


def _upsert_faqs(session: Session) -> int:
    count = 0
    for faq in PublicContentRepository._faqs:
        values = {
            "code": faq.code,
            "question": faq.question,
            "answer": faq.answer,
            "sort_order": faq.sort_order,
            "is_active": faq.is_active,
        }
        statement = insert(FAQModel).values(**values)
        session.execute(
            statement.on_conflict_do_update(
                index_elements=[FAQModel.code],
                set_=values,
            )
        )
        count += 1
    return count


def _upsert_divisions(session: Session, divisions: Iterable[DivisionRecord]) -> int:
    count = 0
    for division in divisions:
        values = {
            "code": division.code,
            "name": division.name,
            "sort_order": division.sort_order,
            "is_active": division.is_active,
        }
        statement = insert(DivisionModel).values(**values)
        session.execute(
            statement.on_conflict_do_update(
                index_elements=[DivisionModel.code],
                set_=values,
            )
        )
        count += 1
    return count


def _upsert_positions(session: Session, divisions: Iterable[DivisionRecord]) -> int:
    division_ids = {
        division.code: division.id
        for division in session.scalars(select(DivisionModel)).all()
    }
    count = 0
    for division in divisions:
        division_id = division_ids[division.code]
        for position in division.positions:
            values = {
                "division_id": division_id,
                "code": position.code,
                "name": position.name,
                "sort_order": position.sort_order,
                "is_active": position.is_active,
            }
            statement = insert(PositionModel).values(**values)
            session.execute(
                statement.on_conflict_do_update(
                    constraint="uq_positions_division_code",
                    set_=values,
                )
            )
            count += 1
    return count


def _upsert_jobs(session: Session, jobs: Iterable[CareerJobRecord]) -> int:
    division_ids = {
        division.code: division.id
        for division in session.scalars(select(DivisionModel)).all()
    }
    positions = session.scalars(select(PositionModel)).all()
    position_ids = {
        (position.division_id, position.code): position.id
        for position in positions
    }

    count = 0
    for job in jobs:
        division_id = division_ids.get(job.division_code)
        position_id = None
        if division_id is not None:
            position_id = position_ids.get((division_id, job.position_code))

        values = {
            "division_id": division_id,
            "position_id": position_id,
            "code": job.code,
            "slug": job.slug,
            "title": job.title,
            "division_code": job.division_code,
            "division_name": job.division_name,
            "position_code": job.position_code,
            "position_name": job.position_name,
            "location": job.location,
            "employment_type": job.employment_type,
            "summary": job.summary,
            "responsibilities": list(job.responsibilities),
            "requirements": list(job.requirements),
            "sort_order": job.sort_order,
            "is_active": job.is_active,
        }
        statement = insert(CareerJobModel).values(**values)
        session.execute(
            statement.on_conflict_do_update(
                index_elements=[CareerJobModel.code],
                set_=values,
            )
        )
        count += 1
    return count


def seed_database(session: Session) -> dict[str, int]:
    divisions = RecruitmentRepository._divisions
    jobs = RecruitmentRepository._jobs
    return {
        "services": _upsert_services(session),
        "faqs": _upsert_faqs(session),
        "divisions": _upsert_divisions(session, divisions),
        "positions": _upsert_positions(session, divisions),
        "career_jobs": _upsert_jobs(session, jobs),
    }


def run_seeders() -> dict[str, int]:
    session_factory = get_session_factory()
    with session_factory() as session:
        counts = seed_database(session)
        session.commit()
        return counts


def run_alembic_upgrade() -> None:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required to run Alembic migrations")

    from alembic import command
    from alembic.config import Config

    backend_dir = Path(__file__).resolve().parents[2]
    config = Config(str(backend_dir / "alembic.ini"))
    command.upgrade(config, "head")


def main() -> None:
    run_alembic_upgrade()
    print("Alembic migrations and seeders applied.")


if __name__ == "__main__":
    main()
