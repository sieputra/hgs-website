# Changelogs

All notable changes and release notes for this project should be documented in this file.

## Unreleased

### Added

- Added a standalone `/faq-kandidat` page for candidate FAQs.
- Added a dedicated landing page contact section with head office details.
- Added backend validation and persistence for the expanded `/career` submission form fields, including family, social media, organization/training, and education details.
- Added a recruitment process stepper to the `/career` hero.
- Added a bouncing chevron control to the `/career` hero that scrolls candidates to the first application section.
- Added an optional alternative applied-position picker to the career application form.
- Added a repeatable required family history section to the career application form.
- Added a repeatable required social media account section to the career application form.
- Added a repeatable candidate organization/training experience section to the career application form.
- Added PostgreSQL integration with SQLAlchemy models, database-backed repositories, `.env.dev` database loading, and Alembic migrations for schema and seed data.
- Added the `/career` candidate application page with EXTL API submission, job/position loading, work experience fields, and a simple math captcha.
- Added a frontend `/api/:path*` rewrite so browser forms can call the backend same-origin by default.
- Added seed-backed EXTL recruitment APIs for divisions, jobs, job detail, contact submissions, and career applications with tests.
- Added backend API documentation with current EXTL/INTL endpoints, response envelope, schemas, examples, and planned API areas.
- Added the initial FastAPI backend scaffold with EXTL/INTL v1 routers, health checks, standard API response helpers, seed-backed public services and FAQ endpoints, environment settings, and backend tests.
- Added a root `.gitignore` for frontend dependencies, Next.js build output, local environment files, logs, and editor artifacts.
- Added the initial Next.js frontend scaffold in `frontend/`.
- Added an HGS-inspired public landing page with split hero slides, service sections, career CTA, contact footer, and local visual assets.

### Changed

- Changed the Contact landing section to use a two-column details and map layout.
- Changed the `/faq-kandidat` page to retain the public landing page menu.
- Changed the Contact landing section to fill the available viewport height and removed its title block.
- Changed the landing page FAQ navigation to open the standalone candidate FAQ page.
- Refined the Contact landing section typography to match the other landing sections.
- Changed the Social Media landing section to fill the available viewport height.
- Changed the About HGS landing section to fill the available viewport height.
- Expanded the career application API documentation with the full request schema, nested item schemas, and an example payload.
- Clarified agent workflow instructions to keep `docs/API.md` updated whenever API behavior changes.
- Changed mobile career form repeatable-section action buttons to center-align with a capped width.
- Changed the `/career` hero chevron animation so the full circular control bounces.
- Changed the `/career` hero to use `hero1.webp` as a 60% opacity background image.
- Changed the `/career` hero section to fill the available viewport height.
- Changed `Sumber informasi lowongan` to a searchable source list with `Website HGS` as the default.
- Changed select-style career application fields to searchable picker UI and restricted preferred placement areas to Jakarta, Bandung, Bogor, Subang, and Sukabumi.
- Moved candidate SIM and medical history fields into the Data Diri section and expanded Pendidikan with entry year, graduation year, school address, and grade/IPK fields.
- Changed the candidate `Posisi dilamar` field to a searchable picker grouped by division.
- Routed public Apply CTAs to the candidate application page and expanded the landing career section to full viewport height.
- Switched backend tests to async ASGI clients and made lightweight route dependencies async to avoid local TestClient thread-bridge hangs.
- Constrained the footer logo in a dedicated responsive container to prevent bottom image stretching and cropping.
- Converted public hero and logo references to correctly named WebP assets with SEO-friendly alt text, dimensions, loading hints, and video poster metadata.
- Refined mobile typography, line-height, touch target sizing, and focus states for better readability and accessibility.
- Moved the HGS logo from the hero media into the mobile menu bar on smaller screens.
- Improved mobile navigation with a hamburger menu and refined responsive hero, section, and footer spacing.
- Moved the hero social buttons closer to the bottom-left corner and replaced text labels with SVG icons.
- Moved the hero brand logo closer to the top-left corner and added a shadow.
- Enabled hero slides to render video assets such as `herovid.mp4` as autoplaying hero media.
- Added per-slide hero image alignment using the `media_align` slide data key.
- Reworked hero copy alignment so the company name sits at the top, the message stays centered, the CTA aligns toward the bottom, and slide controls use chevron icons.
- Improved landing page UX with working hero navigation, complete menu target sections, richer service cards, social links, FAQ content, hover/focus states, and more balanced responsive spacing.
- Set the hero area to fill the available viewport height and tuned hero typography/spacing to fit within that height.
- Removed the menu whitespace divider and made public page sections explicitly full width.
- Replaced the temporary SVG brand mark usage with the provided `logo.jpeg` asset.
- Added project agent memory files: `AGENTS.md` and `SKILL.md`.
- Initialized Git repository metadata and configured the GitHub SSH remote.
- Added this changelog file for future changes and releases.
- Added agent memory rules to keep topic-specific docs and `CHANGELOGS.md` updated with future changes.
- Expanded the root `.gitignore` with Python virtual environment, cache, coverage, packaging, local database, upload, media, and static runtime artifacts for backend development.

### Fixed

- Fixed vertical alignment for career form checkbox rows beside standard fields.
- Fixed candidate form hydration mismatch caused by rendering random captcha values before client mount.

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
