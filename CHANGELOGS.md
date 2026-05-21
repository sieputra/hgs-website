# Changelogs

All notable changes and release notes for this project should be documented in this file.

## Unreleased

### Added

- Added a root `.gitignore` for frontend dependencies, Next.js build output, local environment files, logs, and editor artifacts.
- Added the initial Next.js frontend scaffold in `frontend/`.
- Added an HGS-inspired public landing page with split hero slides, service sections, career CTA, contact footer, and local visual assets.

### Changed

- Reworked hero copy alignment so the company name sits at the top, the message stays centered, the CTA aligns toward the bottom, and slide controls use chevron icons.
- Improved landing page UX with working hero navigation, complete menu target sections, richer service cards, social links, FAQ content, hover/focus states, and more balanced responsive spacing.
- Set the hero area to fill the available viewport height and tuned hero typography/spacing to fit within that height.
- Removed the menu whitespace divider and made public page sections explicitly full width.
- Replaced the temporary SVG brand mark usage with the provided `logo.jpeg` asset.
- Added project agent memory files: `AGENTS.md` and `SKILL.md`.
- Initialized Git repository metadata and configured the GitHub SSH remote.
- Added this changelog file for future changes and releases.
- Added agent memory rules to keep topic-specific docs and `CHANGELOGS.md` updated with future changes.

## Release Template

Use this template when preparing a release:

```markdown
## [version] - YYYY-MM-DD

### Added

- New features or files.

### Changed

- Updates to existing behavior, design, or structure.

### Fixed

- Bug fixes.

### Removed

- Removed features, files, or dependencies.
```
