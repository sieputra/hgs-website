# HGS Backend

FastAPI backend service for the HGS corporate website and recruitment platform.

## Local Development

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

API docs are available at:

```text
http://localhost:8000/docs
```

The maintained Markdown API contract is in `../docs/API.md`.

## Checks

```bash
pytest
```

## Migrations And Seed

The backend loads local database settings from `.env.dev`. Apply schema
migrations and seed data with Alembic through:

```bash
python -m app.db.seed
```

Direct Alembic commands are also available:

```bash
alembic upgrade head
alembic current
```
