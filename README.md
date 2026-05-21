# Product Requirements Document (PRD)

## Project Name
HGS Corporate Website Platform

## Version
1.0

## Executive Summary

This project aims to build a modern corporate landing page and recruitment platform using:

- Frontend: Next.js
- Backend: FastAPI
- Database: PostgreSQL
- Cache: Redis
- Infrastructure: Docker + NGINX

---

## Architecture

```txt
Internet
   │
Cloudflare
   │
NGINX
   │
├── Frontend (Next.js)
└── Backend (FastAPI)
      ├── PostgreSQL
      └── Redis
```

---

## Repository Structure

```txt
project-root/
├── frontend/
├── backend/
├── infra/
└── docker-compose.yml
```

---

## Frontend

- Next.js 15
- TailwindCSS
- shadcn/ui
- SEO optimized
- Responsive design

### Landing Page Sections

- Hero
- About
- Services
- Clients
- Testimonials
- Recruitment CTA
- Contact

### Recruitment Routes

```txt
/career
/career/jobs
/career/jobs/[slug]
```

---

## Backend

### Public API

```txt
/api/extl/v1
```

### Internal API

```txt
/api/intl/v1
```

### Security

- JWT Authentication
- Refresh Token
- RBAC
- Rate Limiting
- HttpOnly Cookies

---

## Database Tables

### Public

```txt
services
clients
career_jobs
career_applications
```

### Internal

```txt
users
roles
permissions
audit_logs
```

---

## DevOps

Containers:

- frontend
- backend
- postgres
- redis
- nginx

---

## Timeline

| Phase | Duration |
|---|---|
| Planning | 1 Week |
| Backend | 3 Weeks |
| Frontend | 3 Weeks |
| QA | 1 Week |

Estimated total: 10-12 weeks.

---

## Final Recommendation

- Separate frontend and backend
- Use FastAPI for scalable API architecture
- Use Next.js for SEO and

## Suggested Monorepo Structure

If you want easier management:
```
hgs-platform/
├── frontend/
├── backend/
├── infra/
├── docs/
└── scripts/
```
## This is cleaner for:

- CI/CD
- Docker
- deployment
- team collaboration