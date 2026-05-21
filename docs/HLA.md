# High-Level Architecture

## Recommended Architecture

```text
Internet
   |
   v
Frontend (Next.js)
   |
   |-- Public API (EXTL API)
   |
   `-- Internal Dashboard/API (INTL API)
            |
            v
      FastAPI Backend
            |
       +----+----+
       |         |
       v         v
  PostgreSQL   Redis
```

## Recommended Folder Structure

```text
project-root/
|
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |   |-- extl/
|   |   |   `-- intl/
|   |   |-- core/
|   |   |-- models/
|   |   |-- schemas/
|   |   |-- services/
|   |   |-- repositories/
|   |   |-- middleware/
|   |   |-- utils/
|   |   `-- main.py
|   |-- alembic/
|   |-- tests/
|   |-- requirements.txt
|   |-- Dockerfile
|   `-- .env
|
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- services/
|   |-- hooks/
|   |-- lib/
|   |-- public/
|   |-- styles/
|   |-- middleware.ts
|   |-- next.config.ts
|   `-- package.json
|
|-- nginx/
|-- docker-compose.yml
`-- README.md
```
