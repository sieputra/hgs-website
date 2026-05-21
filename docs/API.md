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

Planned EXTL endpoints:

```text
GET /api/extl/v1/jobs
GET /api/extl/v1/jobs/{slug}
POST /api/extl/v1/contact
POST /api/extl/v1/career-applications
```

Planned INTL endpoints:

```text
POST /api/intl/v1/auth/login
POST /api/intl/v1/auth/refresh
POST /api/intl/v1/auth/logout
GET /api/intl/v1/admin/jobs
GET /api/intl/v1/admin/users
GET /api/intl/v1/dashboard
```
