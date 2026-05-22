from app.db.session import get_engine
from app.models import Base


def create_database_schema() -> None:
    Base.metadata.create_all(bind=get_engine())
