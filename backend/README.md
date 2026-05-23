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

## Admin Bootstrap

Set `DATABASE_URL`, `ADMIN_AUTH_SECRET_KEY`, and `ADMIN_CLI_SECRET`, then create
or update the first admin account:

```bash
python -m app.cli.create_admin \
  --email admin@example.com \
  --full-name "HGS Admin" \
  --role super_admin
```

The script prompts for `ADMIN_CLI_SECRET` and the admin password, and refuses to
run without the configured CLI secret.
