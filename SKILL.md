# HGS Website Skill

Use this project skill when working in the `hgs-website` repository.

## Purpose

This repository contains the HGS website project. Treat the codebase as the source of truth, follow its existing structure as it grows, and keep changes scoped to the task requested.

## Working Rules

- Read the current files before changing behavior or structure.
- Prefer existing project conventions over introducing new patterns.
- Keep implementation, styling, and content changes focused.
- Add tests or checks when the change affects behavior, build output, or user-facing flows.
- Do not overwrite unrelated local changes.
- Update `AGENTS.md` when durable project knowledge changes.
- Update the matching file in `docs/` when a change affects documented project areas.
- Update `CHANGELOGS.md` under `Unreleased` for meaningful project changes.

## Git Workflow

- Default remote: `git@github.com:sieputra/hgs-website.git`
- Check status before making commits.
- Keep commits focused and descriptive.
- Prefix all AI-authored commit messages with `[AI]`.
- Push only when explicitly requested.

## Frontend Expectations

- Build the usable experience directly rather than a placeholder landing page.
- Match the domain and audience with a clean, practical visual style.
- Verify responsive layout for desktop and mobile when UI work is added.
