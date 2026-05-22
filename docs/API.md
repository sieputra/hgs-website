# Backend API Docs

## Overview

The HGS backend exposes versioned REST APIs through FastAPI.

Base local URL:

```text
http://localhost:8000
```

Interactive docs:

```text
http://localhost:8000/docs
http://localhost:8000/redoc
http://localhost:8000/openapi.json
```

## API Surfaces

| Surface | Prefix | Audience | Auth Status |
| --- | --- | --- | --- |
| EXTL | `/api/extl/v1` | Public website, recruitment pages, external forms | Public for current endpoints |
| INTL | `/api/intl/v1` | Admin dashboard and internal services | Auth pending |

## Response Envelope

All implemented endpoints return the same envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {}
}
```

Fields:

| Field | Type | Description |
| --- | --- | --- |
| `success` | boolean | Request result flag. |
| `message` | string | Human-readable status message. |
| `data` | object or array | Endpoint payload. |
| `meta` | object | Pagination, totals, or supporting metadata. |

## EXTL API

### Health Check

```http
GET /api/extl/v1/health
```

Returns the public API health status.

Response:

```json
{
  "success": true,
  "message": "EXTL API is healthy",
  "data": {
    "status": "ok"
  },
  "meta": {}
}
```

### List Public Services

```http
GET /api/extl/v1/services
```

Returns active public service cards for the website.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `code` | string | Stable service code. |
| `title` | string | Public service title. |
| `summary` | string | Short service description. |
| `sort_order` | integer | Display order. |

Example response:

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "code": "TRUCKING",
      "title": "Trucking",
      "summary": "Daily fleet movement for dependable product distribution.",
      "sort_order": 1
    }
  ],
  "meta": {
    "total": 6
  }
}
```

Current service codes:

| Code | Title |
| --- | --- |
| `TRUCKING` | Trucking |
| `WAREHOUSING` | Warehousing |
| `FIRST_MILE_DELIVERY` | First Mile Delivery |
| `LAST_MILE_DELIVERY` | Last Mile Delivery |
| `DISTRIBUTION_CENTER` | Distribution Center |
| `E_FULFILLMENT` | E-Fulfillment |

### List FAQs

```http
GET /api/extl/v1/faqs
```

Returns active public FAQ content for the website and candidate pages.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `code` | string | Stable FAQ code. |
| `question` | string | Public FAQ question. |
| `answer` | string | Public FAQ answer. |
| `sort_order` | integer | Display order. |

Example response:

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "code": "BUSINESS_FIELD",
      "question": "Bergerak di bidang apa?",
      "answer": "Logistik, Trucking, Pergudangan, dan Distribusi FMCG.",
      "sort_order": 1
    }
  ],
  "meta": {
    "total": 17
  }
}
```

Current FAQ codes:

| Code | Sort Order |
| --- | --- |
| `BUSINESS_FIELD` | 1 |
| `COMPANY_LOCATION` | 2 |
| `OUTSOURCING_COMPANY` | 3 |
| `COMPANY_CLIENTS` | 4 |
| `PLACEMENT_LOCATIONS` | 5 |
| `INTERVIEW_AFTER_WA_OR_PHONE` | 6 |
| `NO_EXPERIENCE_APPLY` | 7 |
| `INTERNSHIP_MEANING` | 8 |
| `ONLINE_INTERVIEW_OUT_OF_TOWN` | 9 |
| `HOW_TO_APPLY` | 10 |
| `INTERVIEW_REQUIREMENTS` | 11 |
| `AFTER_INTERVIEW_STATUS` | 12 |
| `RECRUITMENT_FEE` | 13 |
| `COMPANY_ESTABLISHED` | 14 |
| `CAREER_PATH` | 15 |
| `BPJS_BENEFIT` | 16 |
| `THR_BENEFIT` | 17 |

### List Divisions

```http
GET /api/extl/v1/divisions
```

Returns active division master data with active positions for recruitment forms.
The seed data follows `docs/DATABASE.md`.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `code` | string | Stable division code. |
| `name` | string | Division display name. |
| `sort_order` | integer | Display order. |
| `positions` | array | Active positions for the division. |

Position item:

| Field | Type | Description |
| --- | --- | --- |
| `code` | string | Stable position code. |
| `name` | string | Position display name. |
| `sort_order` | integer | Display order inside the division. |

### List Jobs

```http
GET /api/extl/v1/jobs
```

Returns active public recruitment jobs.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `code` | string | Stable job code. |
| `slug` | string | Public URL slug. |
| `title` | string | Public job title. |
| `division_code` | string | Linked division code. |
| `division_name` | string | Division display name snapshot. |
| `position_code` | string | Linked position code. |
| `position_name` | string | Position display name snapshot. |
| `location` | string | Public placement location. |
| `employment_type` | string | Public employment type. |
| `summary` | string | Short job summary. |
| `responsibilities` | array | Public responsibilities. |
| `requirements` | array | Public requirements. |
| `sort_order` | integer | Display order. |

Current job slugs:

| Slug | Title |
| --- | --- |
| `driver-operasional` | Driver Operasional |
| `helper-gudang` | Helper Gudang |
| `staff-hrd` | Staff HRD |

### Get Job Detail

```http
GET /api/extl/v1/jobs/{slug}
```

Returns one active public recruitment job by slug. Unknown slugs currently use
FastAPI's default `404` response with `detail: "Career job not found"`.

### Submit Contact Form

```http
POST /api/extl/v1/contact
```

Accepts public contact form submissions.

Request body:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `full_name` | string | Yes | Sender name. |
| `email` | string | Yes | Sender email address. |
| `phone_number` | string | No | Sender phone number. |
| `company_name` | string | No | Sender company name. |
| `message` | string | Yes | Contact message. |

Success response data:

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | Submission identifier. |
| `status` | string | Current status, initially `submitted`. |
| `submitted_at` | datetime | Submission timestamp. |

### Submit Career Application

```http
POST /api/extl/v1/career-applications
```

Accepts external candidate submissions using the candidate fields defined in
`docs/DATABASE.md`. `career_job_slug` is optional; when provided, it must match
an active public job slug. The `/career` form submits family history,
social-media accounts, organization/training experience, and work experience as
nested arrays. Social-media accounts are required with at least one and at most
five entries; family members are required with at least one and at most six
entries; organization and work experiences are optional and capped at five
entries each.

Success response data:

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | Submission identifier. |
| `status` | string | Current status, initially `submitted`. |
| `submitted_at` | datetime | Submission timestamp. |

## INTL API

### Health Check

```http
GET /api/intl/v1/health
```

Returns the internal API health status. Authentication is not implemented yet
for this endpoint.

Response:

```json
{
  "success": true,
  "message": "INTL API is healthy",
  "data": {
    "status": "ok"
  },
  "meta": {}
}
```

## Error Handling

The current scaffold relies on FastAPI's default validation and error responses
for route errors. A project-wide error envelope should be added when request
validation, authentication, and persistence endpoints are introduced.

## Planned API Areas

Planned EXTL work:

- Database-backed persistence for the current seed-backed EXTL endpoints.

Planned INTL endpoints:

```text
POST /api/intl/v1/auth/login
POST /api/intl/v1/auth/refresh
POST /api/intl/v1/auth/logout
GET /api/intl/v1/admin/jobs
GET /api/intl/v1/admin/users
GET /api/intl/v1/dashboard
```
