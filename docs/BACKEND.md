# Backend Architecture

## Current Implementation

The backend is scaffolded in `backend/` as a FastAPI service.

Implemented routes:

```text
GET /api/extl/v1/health
GET /api/extl/v1/services
GET /api/extl/v1/faqs
GET /api/extl/v1/gallery/images
GET /api/extl/v1/divisions
GET /api/extl/v1/jobs
GET /api/extl/v1/jobs/{slug}
POST /api/extl/v1/contact
POST /api/extl/v1/career-applications
GET /api/intl/v1/health
POST /api/intl/v1/auth/login
GET /api/intl/v1/auth/me
GET /api/intl/v1/roles
POST /api/intl/v1/roles
PATCH /api/intl/v1/roles/{role_id}
DELETE /api/intl/v1/roles/{role_id}
GET /api/intl/v1/users
POST /api/intl/v1/users
PATCH /api/intl/v1/users/{user_id}
DELETE /api/intl/v1/users/{user_id}
GET /api/intl/v1/services
POST /api/intl/v1/services
PATCH /api/intl/v1/services/{service_id}
DELETE /api/intl/v1/services/{service_id}
GET /api/intl/v1/faqs
POST /api/intl/v1/faqs
PATCH /api/intl/v1/faqs/{faq_id}
DELETE /api/intl/v1/faqs/{faq_id}
GET /api/intl/v1/gallery/images
POST /api/intl/v1/gallery/images
PATCH /api/intl/v1/gallery/images/{image_id}
DELETE /api/intl/v1/gallery/images/{image_id}
```

Endpoint contracts and examples are documented in `docs/API.md`.

The EXTL content, recruitment, contact, and candidate submission endpoints use
PostgreSQL repositories when `DATABASE_URL` is configured through `.env.dev` or
the shell environment. Without `DATABASE_URL`, they fall back to seed-backed
in-memory repositories so local API tests and frontend development can run
without a database. Route handlers call a service layer, and the service layer
calls a repository layer so the public API contract stays stable.

Career application submissions persist the `/career` form's flat candidate
fields on `career_applications`, store uploaded self-photo and PDF CV paths
under `/uploads/career-applications/`, and use child tables for social-media
accounts, family members, organization/training experience, and work history.

Database setup:

```bash
cd backend
python -m app.db.seed
```

`python -m app.db.seed` reads `.env.dev` and delegates to
`alembic upgrade head`. Alembic revisions create the schema and upsert:

- `services`
- `faqs`
- `gallery_images`
- `divisions`
- `positions`
- `career_jobs`
- `admin_roles`
- `admin_users`

Gallery uploads are optimized to WebP, resized to fit 1920x1280, stored under
`uploads/gallery/`, and served from `/uploads`. The Next.js frontend rewrites
`/uploads/:path*` to the backend for local development.

The INTL admin surface uses HMAC-signed bearer tokens and role-based
permissions. Built-in roles are `super_admin`, `admin`, `content_admin`, and
`recruitment_admin`. Service and FAQ content management use `service.read`,
`service.create`, `service.update`, `service.delete`, `faq.read`, `faq.create`,
`faq.update`, and `faq.delete`; admin gallery management requires
`gallery.read`, `gallery.create`, `gallery.update`, or `gallery.delete`;
division management requires `division.read`, `division.create`,
`division.update`, or `division.delete`; position management requires
`position.read`, `position.create`, `position.update`, or `position.delete`;
job-posting management requires `job.read`, `job.create`, `job.update`, or
`job.delete`; role management requires `role.read`, `role.create`,
`role.update`, or `role.delete`; user management requires `user.read`,
`user.create`, `user.update`, or
`user.delete`. Role codes are stable after creation, while role name,
description, and permissions can be edited. System roles cannot be deleted,
assigned roles must be unassigned before deletion, and admins cannot delete
their own active account.

Bootstrap or update an admin account with the protected CLI after setting
`DATABASE_URL`, `ADMIN_AUTH_SECRET_KEY`, and `ADMIN_CLI_SECRET`:

```bash
python -m app.cli.create_admin \
  --email admin@example.com \
  --full-name "HGS Admin" \
  --role super_admin
```

The CLI refuses to run without `ADMIN_CLI_SECRET`, prompts for that secret, and
prompts for the admin password without echoing it.

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
/api/intl/v1/jobs
/api/intl/v1/recruitment/applications
/api/intl/v1/recruitment/applications/{application_id}
/api/intl/v1/recruitment/applications/{application_id}/comments
/api/intl/v1/users
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
