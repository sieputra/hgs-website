# Backend Architecture

## Current Implementation

The backend is scaffolded in `backend/` as a FastAPI service.

Implemented routes:

```text
GET /api/extl/v1/health
GET /api/extl/v1/services
GET /api/extl/v1/faqs
GET /api/extl/v1/divisions
GET /api/extl/v1/jobs
GET /api/extl/v1/jobs/{slug}
POST /api/extl/v1/contact
POST /api/extl/v1/career-applications
GET /api/intl/v1/health
```

Endpoint contracts and examples are documented in `docs/API.md`.

The EXTL content, recruitment, contact, and candidate submission endpoints use
PostgreSQL repositories when `DATABASE_URL` is configured through `.env.dev` or
the shell environment. Without `DATABASE_URL`, they fall back to seed-backed
in-memory repositories so local API tests and frontend development can run
without a database. Route handlers call a service layer, and the service layer
calls a repository layer so the public API contract stays stable.

Career application submissions persist the `/career` form's flat candidate
fields on `career_applications`, and use child tables for social-media accounts,
family members, organization/training experience, and work history.

Database setup:

```bash
cd backend
python -m app.db.seed
```

`python -m app.db.seed` reads `.env.dev` and delegates to
`alembic upgrade head`. Alembic revisions create the schema and upsert:

- `services`
- `faqs`
- `divisions`
- `positions`
- `career_jobs`

Direct Alembic commands are also available:

```bash
alembic upgrade head
alembic current
```

Local commands:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m app.db.seed
uvicorn app.main:app --reload
pytest
```

## Backend Recommendation

FastAPI is recommended for the backend.

| Feature | FastAPI |
| --- | --- |
| Performance | Very high |
| Async support | Native |
| JWT support | Excellent |
| Swagger docs | Automatic |
| Type safety | Excellent |
| Clean architecture | Easy |
| Enterprise ready | Yes |
| Learning curve | Moderate |

## API Separation Strategy

### EXTL API

The EXTL API is the public API surface.

Use it for:

- Landing page content
- Public recruitment jobs
- Contact forms
- Company profile data
- SEO data

Example routes:

```text
/api/extl/v1/jobs
/api/extl/v1/contact
/api/extl/v1/services
```

Security recommendations:

- Rate limiting
- Optional JWT
- Optional API key
- WAF/CDN protection

### INTL API

The INTL API is the internal API surface.

Use it for:

- Admin dashboard
- CMS management
- Recruitment management
- Analytics
- Employee management

Example routes:

```text
/api/intl/v1/admin/jobs
/api/intl/v1/admin/users
/api/intl/v1/dashboard
```

Security recommendations:

- Mandatory JWT
- RBAC
- Optional IP allowlist
- Refresh token rotation

## JWT Security Architecture

Recommended token lifetime:

- Access token: 15 minutes
- Refresh token: 7 days

Use:

- HttpOnly cookies
- Refresh token rotation
- Revoked token blacklist
- RBAC middleware

Recommended libraries:

- `python-jose`
- `passlib`
- `bcrypt`

## Suggested API Pattern

Example response:

```json
{
  "success": true,
  "message": "Success",
  "data": [],
  "meta": {}
}
```

## Recommended Backend Pattern

```text
Controller
  -> Service
    -> Repository
      -> Database
```

This keeps enterprise project maintenance easier as the backend grows.
