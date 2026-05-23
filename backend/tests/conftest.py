import pytest


@pytest.fixture(autouse=True)
def use_seed_content_for_route_tests(monkeypatch: pytest.MonkeyPatch):
    from app.core.config import settings
    from app.db.session import get_engine
    from app.db.session import get_session_factory

    monkeypatch.setattr(settings, "database_url", None)
    get_engine.cache_clear()
    get_session_factory.cache_clear()
    yield
    get_engine.cache_clear()
    get_session_factory.cache_clear()


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
