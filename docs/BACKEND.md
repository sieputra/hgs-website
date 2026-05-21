# Backend Architecture

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
