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
| INTL | `/api/intl/v1` | Admin dashboard and internal services | Bearer admin token with RBAC permissions |

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

### List Gallery Images

```http
GET /api/extl/v1/gallery/images
```

Returns active public gallery images for the homepage gallery section.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | Gallery image identifier. |
| `title` | string | Image title shown in the hover overlay. |
| `caption` | string | Image caption shown in the hover overlay. |
| `image_url` | string | Public optimized WebP image URL. Seed images use `/images/gallery/...`; uploaded images use `/uploads/gallery/...`. |
| `image_alt` | string | Accessible image alt text. |
| `sort_order` | integer | Display order. |

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

Request body:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `career_job_slug` | string or null | No | Active public job slug. Use `null` for a general application. |
| `full_name` | string | Yes | Candidate full name, max 150 chars. |
| `nickname` | string | Yes | Candidate nickname, max 100 chars. |
| `identity_number` | string | Yes | KTP number, max 32 chars. |
| `identity_valid_until` | date | Yes | KTP validity date. Use `9999-12-31` when the candidate selects seumur hidup. |
| `identity_address` | string | Yes | KTP address. |
| `domicile_address` | string | Yes | Current domicile address. |
| `driving_license_number` | string | Yes | SIM number, max 32 chars. |
| `driving_license_class` | string or null | No | SIM class, max 20 chars. |
| `driving_license_valid_until` | date | Yes | SIM validity date. |
| `birth_place` | string | Yes | Birth place, max 100 chars. |
| `birth_date` | date | Yes | Birth date. |
| `age` | integer | Yes | Candidate age, 15-80. |
| `marital_status` | string or null | No | Marital status, max 50 chars. |
| `gender` | string or null | No | Gender, max 30 chars. |
| `mother_name` | string | Yes | Mother's name, max 150 chars. |
| `religion` | string or null | No | Religion, max 50 chars. |
| `phone_number` | string | Yes | Phone or WhatsApp number, max 30 chars. |
| `medical_history` | string or null | No | Candidate medical history. |
| `education_level` | string or null | No | Last education level, max 100 chars. |
| `school_name` | string or null | No | School or university name, max 150 chars. |
| `major` | string or null | No | Major, max 150 chars. |
| `school_entry_year` | integer or null | No | Entry year, 1950-2100. |
| `school_graduation_year` | integer or null | No | Graduation year, 1950-2100. |
| `school_address` | string or null | No | School or university address. |
| `grade_point_average` | string or null | No | Grade average or GPA as entered, max 30 chars. |
| `applied_position` | string | Yes | Position applied for, max 100 chars. |
| `alternative_applied_position` | string or null | No | Alternative position, max 100 chars. |
| `vacancy_source` | string | Yes | Vacancy information source, max 100 chars. |
| `preferred_area` | string or null | No | Preferred placement area, max 100 chars. |
| `willing_to_be_placed_anywhere` | boolean | Yes | Whether the candidate is willing to be placed according to company needs. |
| `available_interview_date` | date or null | No | Candidate's available interview date. |
| `interview_invitation_reason` | string | Yes | Candidate's reason for joining the interview process. |
| `social_media_accounts` | array | Yes | One to five social media account objects. |
| `family_members` | array | Yes | One to six family member objects. |
| `organization_experiences` | array | No | Zero to five organization/training experience objects. |
| `work_experiences` | array | No | Zero to five work experience objects. |

`social_media_accounts` item:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `platform` | string | Yes | Social media platform, max 50 chars. |
| `account_id` | string | Yes | Nickname or account ID, max 150 chars. |

`family_members` item:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `relationship` | string | Yes | Family relationship, max 50 chars. |
| `name` | string | Yes | Family member name, max 150 chars. |
| `education_level` | string or null | No | Last education level, max 100 chars. |
| `occupation` | string or null | No | Occupation, max 150 chars. |
| `workplace` | string or null | No | Workplace, max 150 chars. |

`organization_experiences` item:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `organization_name` | string | Yes | Organization or training name, max 150 chars. |
| `position` | string or null | No | Role or position, max 100 chars. |
| `period` | string or null | No | Candidate-entered period, max 100 chars. |

`work_experiences` item:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `company_name` | string | Yes | Company name, max 150 chars. |
| `position` | string or null | No | Position, max 100 chars. |
| `employment_duration` | string or null | No | Employment duration, max 100 chars. |
| `salary` | decimal or null | No | Last salary, must be greater than or equal to zero. |
| `company_phone_number` | string or null | No | Company phone number, max 30 chars. |
| `leaving_reason` | string or null | No | Reason for leaving. |
| `company_comment` | string or null | No | Candidate notes about the company. |

Example request:

```json
{
  "career_job_slug": "driver-operasional",
  "full_name": "Andi Saputra",
  "nickname": "Andi",
  "identity_number": "3171000000000001",
  "identity_valid_until": "9999-12-31",
  "identity_address": "Jakarta Selatan",
  "domicile_address": "Jakarta Selatan",
  "driving_license_number": "SIMB10001",
  "driving_license_class": "B1",
  "driving_license_valid_until": "2030-12-31",
  "birth_place": "Jakarta",
  "birth_date": "1994-05-10",
  "age": 31,
  "marital_status": "Menikah",
  "gender": "Laki-laki",
  "mother_name": "Siti",
  "religion": "Islam",
  "phone_number": "08123456789",
  "medical_history": null,
  "education_level": "SMA",
  "school_name": "SMA Contoh",
  "major": "IPA",
  "school_entry_year": 2009,
  "school_graduation_year": 2012,
  "school_address": "Jakarta Selatan",
  "grade_point_average": "8.5",
  "applied_position": "Driver",
  "alternative_applied_position": "Helper",
  "vacancy_source": "Website HGS",
  "preferred_area": "Jakarta",
  "willing_to_be_placed_anywhere": true,
  "available_interview_date": "2026-06-01",
  "interview_invitation_reason": "Berpengalaman sebagai driver distribusi.",
  "social_media_accounts": [
    {
      "platform": "Instagram",
      "account_id": "andi.saputra"
    }
  ],
  "family_members": [
    {
      "relationship": "Ibu",
      "name": "Siti",
      "education_level": "SMA",
      "occupation": "Wiraswasta",
      "workplace": "Toko Keluarga"
    }
  ],
  "organization_experiences": [
    {
      "organization_name": "Pelatihan Safety Driving",
      "position": "Peserta",
      "period": "2024"
    }
  ],
  "work_experiences": [
    {
      "company_name": "PT Lama",
      "position": "Driver",
      "employment_duration": "2 tahun",
      "salary": "4500000",
      "company_phone_number": "021123456",
      "leaving_reason": "Kontrak selesai",
      "company_comment": "Lingkungan kerja baik"
    }
  ]
}
```

Success response data:

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | Submission identifier. |
| `status` | string | Current status, initially `submitted`. |
| `submitted_at` | datetime | Submission timestamp. |

## INTL API

INTL admin endpoints require an `Authorization: Bearer <token>` header unless
the endpoint is explicitly marked public.

### Health Check

```http
GET /api/intl/v1/health
```

Returns the internal API health status. This endpoint remains public.

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

### Admin Login

```http
POST /api/intl/v1/auth/login
```

Public endpoint. Authenticates an active admin user.

Request:

```json
{
  "email": "admin@example.com",
  "password": "minimum-12-chars"
}
```

Response data:

| Field | Type | Description |
| --- | --- | --- |
| `access_token` | string | HMAC-signed bearer token. |
| `token_type` | string | Always `bearer`. |
| `user` | object | Current admin user with role and permissions. |

### Current Admin User

```http
GET /api/intl/v1/auth/me
```

Requires any active admin token.

### List Admin Roles

```http
GET /api/intl/v1/roles
```

Required permission: `role.read`.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | Role identifier. |
| `code` | string | Stable role code. |
| `name` | string | Role display name. |
| `description` | string or null | Role purpose. |
| `permissions` | array | Permission codes, or `*` for full access. |
| `is_system` | boolean | Indicates built-in seed role. |

Built-in role codes:

| Code | Permissions |
| --- | --- |
| `super_admin` | `*` |
| `admin` | `role.*`, `user.*`, `service.*`, `faq.*`, `gallery.read`, `gallery.create` |
| `content_admin` | `service.*`, `faq.*`, `gallery.read`, `gallery.create` |
| `recruitment_admin` | `recruitment.read`, `recruitment.update` |

### Create Admin Role

```http
POST /api/intl/v1/roles
```

Required permission: `role.create`.

Request:

```json
{
  "code": "operations_admin",
  "name": "Operations Admin",
  "description": "Can manage operational admin tools.",
  "permissions": ["user.read", "gallery.read"]
}
```

### Update Admin Role

```http
PATCH /api/intl/v1/roles/{role_id}
```

Required permission: `role.update`. Role code is stable and cannot be changed
through this endpoint.

Request fields are optional:

```json
{
  "name": "Operations Lead",
  "description": "Updated role description.",
  "permissions": ["user.read", "gallery.read", "gallery.create"]
}
```

### Delete Admin Role

```http
DELETE /api/intl/v1/roles/{role_id}
```

Required permission: `role.delete`. System roles cannot be deleted, and roles
assigned to admin users must be unassigned before deletion.

### List Admin Users

```http
GET /api/intl/v1/users
```

Required permission: `user.read`.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | Admin user identifier. |
| `email` | string | Login email. |
| `full_name` | string | Admin display name. |
| `is_active` | boolean | Whether login is allowed. |
| `role` | object | Assigned admin role. |
| `last_login_at` | datetime or null | Last successful login timestamp. |
| `created_at` | datetime | Record creation timestamp. |
| `updated_at` | datetime | Last update timestamp. |

### Create Admin User

```http
POST /api/intl/v1/users
```

Required permission: `user.create`.

Request:

```json
{
  "email": "ops-admin@example.com",
  "full_name": "Ops Admin",
  "password": "minimum-12-chars",
  "role_code": "admin",
  "is_active": true
}
```

### Update Admin User

```http
PATCH /api/intl/v1/users/{user_id}
```

Required permission: `user.update`.

Request fields are optional:

```json
{
  "full_name": "Updated Name",
  "role_code": "content_admin",
  "is_active": true,
  "password": "new-minimum-12-chars"
}
```

### Delete Admin User

```http
DELETE /api/intl/v1/users/{user_id}
```

Required permission: `user.delete`. The signed-in admin cannot delete their own
account from the active session.

### List Admin Services

```http
GET /api/intl/v1/services
```

Returns all service records, including inactive services. Required permission:
`service.read`.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | Service identifier. |
| `code` | string | Stable service code. |
| `title` | string | Public service title. |
| `summary` | string | Short public service description. |
| `sort_order` | integer | Display order. |
| `is_active` | boolean | Whether the service appears on public EXTL listings. |
| `created_at` | datetime | Record creation timestamp. |
| `updated_at` | datetime | Last update timestamp. |

### Create Admin Service

```http
POST /api/intl/v1/services
```

Required permission: `service.create`. The service code must be unique and is
stored uppercase.

Request:

```json
{
  "code": "COLD_CHAIN",
  "title": "Cold Chain",
  "summary": "Temperature-controlled distribution support.",
  "sort_order": 7,
  "is_active": true
}
```

### Update Admin Service

```http
PATCH /api/intl/v1/services/{service_id}
```

Required permission: `service.update`. Service code is stable and cannot be
changed through this endpoint.

Request fields are optional:

```json
{
  "title": "Cold Chain Logistics",
  "summary": "Updated public description.",
  "sort_order": 7,
  "is_active": true
}
```

### Delete Admin Service

```http
DELETE /api/intl/v1/services/{service_id}
```

Required permission: `service.delete`. Deletes the service record.

### List Admin FAQs

```http
GET /api/intl/v1/faqs
```

Returns all FAQ records, including inactive FAQs. Required permission:
`faq.read`.

Response data item:

| Field | Type | Description |
| --- | --- | --- |
| `id` | UUID | FAQ identifier. |
| `code` | string | Stable FAQ code. |
| `question` | string | Public FAQ question. |
| `answer` | string | Public FAQ answer. |
| `sort_order` | integer | Display order. |
| `is_active` | boolean | Whether the FAQ appears on public EXTL listings. |
| `created_at` | datetime | Record creation timestamp. |
| `updated_at` | datetime | Last update timestamp. |

### Create Admin FAQ

```http
POST /api/intl/v1/faqs
```

Required permission: `faq.create`. The FAQ code must be unique and is stored
uppercase.

Request:

```json
{
  "code": "APPLICATION_STATUS",
  "question": "Bagaimana cara cek status lamaran?",
  "answer": "Hubungi Admin HR pada jam kerja.",
  "sort_order": 18,
  "is_active": true
}
```

### Update Admin FAQ

```http
PATCH /api/intl/v1/faqs/{faq_id}
```

Required permission: `faq.update`. FAQ code is stable and cannot be changed
through this endpoint.

Request fields are optional:

```json
{
  "question": "Bagaimana cara cek status lamaran?",
  "answer": "Jawaban yang sudah diperbarui.",
  "sort_order": 18,
  "is_active": true
}
```

### Delete Admin FAQ

```http
DELETE /api/intl/v1/faqs/{faq_id}
```

Required permission: `faq.delete`. Deletes the FAQ record.

### List Admin Gallery Images

```http
GET /api/intl/v1/gallery/images
```

Returns gallery images for admin management, including inactive images and file
metadata. Required permission: `gallery.read`.

### Upload Admin Gallery Image

```http
POST /api/intl/v1/gallery/images
Content-Type: multipart/form-data
```

Uploads a gallery image, optimizes it to WebP, and creates its gallery record.
Required permission: `gallery.create`.

Multipart fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `image` | file | Yes | JPEG, PNG, WebP, or GIF image, up to 8 MB by default. The backend strips metadata, resizes to fit 1920x1280, and stores WebP output. |
| `title` | string | Yes | Image title. |
| `caption` | string | Yes | Image caption. |
| `image_alt` | string | No | Accessible alt text. Defaults to title. |
| `sort_order` | integer | No | Display order. Defaults to the next available order. |
| `is_active` | boolean | No | Public visibility. Defaults to `true`. |

Admin response data includes public gallery fields plus `original_filename`,
`content_type`, `file_size`, `is_active`, `created_at`, and `updated_at`.

## Error Handling

The current scaffold relies on FastAPI's default validation and error responses
for route errors. A project-wide error envelope should be added when request
validation, authentication, and persistence endpoints are introduced.

## Planned API Areas

Planned EXTL work:

- Database-backed persistence for the current seed-backed EXTL endpoints.

Planned INTL endpoints:

```text
POST /api/intl/v1/auth/refresh
POST /api/intl/v1/auth/logout
GET /api/intl/v1/jobs
GET /api/intl/v1/dashboard
```
