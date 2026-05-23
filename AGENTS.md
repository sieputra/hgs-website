# Agent Memory

## Project

- Name: HGS Website
- Repository path: `/home/sieputra/DATA/PROJECT/PCHARLES/hgs-website`
- Remote: `git@github.com:sieputra/hgs-website.git`

## Collaboration Notes

- Keep this file as durable project memory for future agent sessions.
- Store stable facts here, not temporary task notes.
- Use `SKILL.md` for repeatable working instructions and project-specific agent behavior.
- Documentation is separated by topic in the `docs/` folder. When changing project behavior, architecture, database design, deployment, SEO, frontend, or backend decisions, update the matching docs file.
- When changing any API endpoint, request/response schema, validation behavior, route, or API error behavior, update `docs/API.md` in the same change.
- Every meaningful project change should also update `CHANGELOGS.md` under `Unreleased`.
- For frontend checking, if port 3000 is already running, use the existing server instead of starting another dev server on a different port.

## Current State

- Project initialized with agent memory files.
- Git remote should be configured as `origin` using the SSH URL above.
- Backend scaffold exists in `backend/` using FastAPI with EXTL/INTL v1 routers and seed-backed public content endpoints.
- Admin dashboard lives at `/admin`; INTL admin APIs use bearer-token auth with RBAC roles and a protected admin bootstrap CLI.
- Default admin datatable CRUD workflow: create and edit open form modals; delete opens a confirmation modal before the API call.
- Admin dashboard shell convention: the left sidebar is sticky and foldable, contains only primary navigation, and account/sign-out controls live in a square sticky top app bar.
- Admin Human Resources menu contains Division, Position, and Jobs; all use modal CRUD, confirmation deletes, inline status switches, and draggable row ordering.
