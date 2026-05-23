# Frontend Architecture

## Recommended Stack

- Next.js App Router
- React Server Components
- ISR/SSG for SEO
- Tailwind CSS and shadcn/ui remain the intended UI stack as the app grows.
- The first frontend implementation uses plain global CSS in the Next.js app so the visual direction can be established before adding component libraries.
- Public photographic assets should be referenced with correctly named WebP files, explicit dimensions, and descriptive alt text. Video hero media should use a lightweight poster and metadata preload.

## Current Implementation

- The frontend lives in `frontend/`.
- The initial public page is implemented with Next.js App Router at `frontend/app/page.tsx`.
- A root `TopProgressBar` client component displays a thin fixed progress
  indicator during same-site route navigation and page unloads.
- The Services homepage section loads card content from `GET /api/extl/v1/services` and falls back to local service content when the API is unavailable.
- Candidate applications are implemented at `frontend/app/career/page.tsx`.
- The public gallery is implemented as a homepage section in `frontend/app/page.tsx`, loads `GET /api/extl/v1/gallery/images`, and falls back to optimized local WebP gallery images when the API is unavailable.
- Candidate FAQs are implemented as a standalone page at `frontend/app/faq-kandidat/page.tsx`, loaded from `GET /api/extl/v1/faqs`, displayed as an accordion with the first FAQ open by default, and retain the public menu and footer.
- The first viewport follows the HGS reference direction: black navigation, split hero layout, logistics/staff imagery, dark copy panel, large serif headline, script accent word, rounded CTA, social buttons, and HGS logo placement.
- The hero auto-advances through stacked slides every 6.5 seconds by hiding the current slide and fading in the next, pauses while hovered or focused, and respects reduced-motion preferences.
- The hero includes a fixed right-side vertical slide indicator with clickable current-slide dots, and wheel scrolling over the hero moves up or down through slides.
- The About HGS landing section fills the available viewport height beneath the sticky header.
- The Gallery homepage section fills the available viewport height beneath the sticky header, vertically centers the horizontal image mosaic, uses arrow controls, and hides the horizontal scrollbar.
- The Social Media landing section fills the available viewport height beneath the sticky header.
- The Contact landing section fills the available viewport height beneath the sticky header with office contact details and an embedded map in a two-column desktop layout.
- The homepage Careers section fills the available viewport height, loads active public jobs from `GET /api/extl/v1/jobs`, falls back to bundled starter jobs, shows them as cards with Apply links, and includes an eye-icon detail button that opens a popup with responsibilities, requirements, and a selected-job application link.
- Local brand and hero visuals live in `frontend/public/images/`.
- The hero currently supports WebP image slides and MP4 video slides through the slide data in `frontend/app/page.tsx`.
- Browser-side EXTL API calls are same-origin by default through the Next.js `/api/:path*` rewrite.
- Uploaded backend media is available to the frontend through the Next.js `/uploads/:path*` rewrite.
- The admin dashboard is available at `/admin` with login, a default Dashboard
  page, route-backed Services, FAQ, Users, and Roles pages, user creation, role
  assignment, activation toggles, and modal CRUD actions backed by the INTL API.
- After admin login, users land on `/admin`. Users and Roles are route-backed
  admin sections at `/admin/users` and `/admin/roles`; Human Resources uses
  `/admin/recruitment`, `/admin/divisions`, `/admin/positions`, and
  `/admin/jobs`; content management uses `/admin/services`, `/admin/faqs`, and
  `/admin/gallery`.
- Admin menu pages are dynamic server-rendered routes backed by the admin token
  cookie. Each route loads only the data needed for that menu: Users loads
  users plus role options for assignment, while Roles loads roles only.
- The admin login flow mirrors the bearer token into both localStorage and the
  `hgs_admin_token` cookie so server-rendered admin routes can authenticate.
- Admin datatable CRUD uses the default dashboard workflow: create and edit
  actions open form modals, and delete actions open confirmation modals before
  calling the API. Success and error feedback appears as popup toast
  notifications instead of inline content notices.
- Services and FAQ admin tables hide internal code/order columns, allow direct
  active/inactive visibility changes through switch controls, and support
  drag-and-drop row reordering that persists `sort_order` through the INTL API.
- Gallery admin management lives at `/admin/gallery` under Content Management.
  It lists INTL gallery image records with thumbnails, supports drag-and-drop
  ordering, inline active/inactive switches, edit/delete action modals, and
  drop-target image uploads or replacement through multipart INTL endpoints.
- Human Resources admin management lives at `/admin/recruitment`,
  `/admin/divisions`, `/admin/positions`, and `/admin/jobs`. Recruitment is the
  first Human Resources menu item and displays career applications as a list or
  kanban view using the New, Interview HR, Interview User, Announcement, and
  Done status columns; the kanban board fills the available admin content
  height, and the list/kanban cards do not expose inline status-changing
  controls. Kanban cards can be dragged between columns using the same allowed
  status flow as the detail-panel status dropdown; dropping a card into Done
  sets it to Rejected by default. Clicking a kanban card opens a full-panel candidate detail popup
  and then loads the full applicant detail for that card. The panel has
  icon-only tabs for applied position, candidate identity, latest education,
  family history, social media, organization/training history, and work
  history, shows detail fields as inline text, and displays the uploaded
  candidate photo as a small header thumbnail that opens a larger photo
  preview popup. The panel is fullscreen,
  edge-to-edge, uses a red close button, and scrolls tab content only when the
  content exceeds the available space. A green status dropdown sits to the left
  of the close button and exposes the next allowed workflow actions for the
  current status. The panel keeps internal recruitment comments in a right-side
  rail with a textarea composer at the bottom. The identity tab does not show
  upload file pills; uploaded CVs are shown in a dedicated CV tab with an error
  fallback when the file cannot be loaded. The list view provides filters for
  candidate name, phone number, preferred area, applied date range, and job
  position, omits file links, and opens the same full-panel candidate detail
  popup from an eye-icon action button at the right side of each row. List rows
  show applicant thumbnails in the candidate column, and clicking an uploaded
  thumbnail opens the larger photo preview popup. Kanban
  cards omit file links, and
  cards in the Done column show only candidate name and phone with pastel
  colors by final status: green for Onboard, red for Rejected, and yellow for
  Canceled. Division, Position, and Jobs tables use modal
  create/edit forms, confirmation modals before delete calls, inline
  active/inactive switches, and drag-and-drop row reordering that persists
  `sort_order` through the INTL API.
- The Jobs admin form selects Position from the Position master table, limits
  Location to Jakarta, Bandung, Bogor, Subang, and Sukabumi as selectable tags,
  uses an Employment Type dropdown for Full Time or Part Time, and edits
  Responsibilities and Requirements as add/remove list rows.
- Role create/edit forms use a grouped permission tree with checkbox controls,
  including an all-permissions root option and module-level parent checkboxes.
  The role modal uses a two-column desktop layout with role details on the left
  and permission selection on the right.
- The `/admin` desktop sidebar is sticky, supports fold/unfold, keeps primary
  navigation at the top without data-count badges, uses inline SVG icons, groups
  Recruitment, Division, Position, and Jobs under Human Resources, Users and
  Roles under a default-collapsed User Management section with an
  expand/collapse row, and moves the signed-in account block plus sign-out
  action to a square, sticky top app bar.
- The `/admin` left navigation and top navigation are reusable client
  components in `frontend/app/admin/components/AdminDashboardShell.tsx`; Human
  Resources contains Recruitment, Division, Position, and Jobs, Content
  Management contains Services, FAQ, and Gallery, while User Management contains
  Users and Roles. Feature pages should use the server wrapper in
  `frontend/app/admin/components/AdminServerShell.tsx` unless they need to
  compose `AdminLeftNavbar` and `AdminTopNavbar` directly.
- The API rewrite targets `API_BASE_URL`, then `NEXT_PUBLIC_API_BASE_URL`, and falls back to `http://localhost:8000` for local development.
- `NEXT_PUBLIC_API_BASE_URL` can still be set when the browser should call a public API host directly instead of the same-origin rewrite.

## Suggested Landing Page Structure

The public corporate website can start as a single page with focused sections:

```text
/
|-- Hero
|-- About Company
|-- Services
|-- Why Choose Us
|-- Fleet / Operations
|-- Technology
|-- Clients
|-- Testimonials
|-- Recruitment CTA
|-- Contact
`-- Footer
```

## Recruitment Feature

Recruitment should live on separate routes because it tends to grow independently.

```text
/career
/career/jobs
/career/jobs/[slug]
```

Current `/career` behavior:

- Opens from the public Apply CTAs.
- Displays a full-height `hero1.webp` image hero with a bouncing chevron link that scrolls to the first application section.
- Shows a recruitment process stepper in the hero: Candidate Submission, HR Interview, User Interview, and Announcement.
- Centers repeatable-section add/remove action buttons on mobile.
- Aligns checkbox rows with neighboring form controls on desktop while keeping stacked mobile fields compact.
- Loads public jobs and divisions from the EXTL API when available, with bundled starter jobs available for prefilled links if the jobs API cannot be reached.
- Prefills `Lowongan tersedia` and `Posisi dilamar` when opened with a `job` query parameter.
- Submits candidate payloads to `POST /api/extl/v1/career-applications` as multipart form data with required self-photo and PDF CV uploads.
- Shows toast notifications for career form submission success and error states, disables the submit button while submitting, and displays a full-screen submission progress overlay.
- Uses a simple client-side math captcha before allowing submission.
- Shows `Posisi dilamar` as a searchable picker grouped by division.
- Supports an optional `Alternatif Posisi dilamar` picker and limits preferred placement area choices to Jakarta, Bandung, Bogor, Subang, and Sukabumi.
- Shows `Sumber informasi lowongan` as a searchable source list with `Website HGS` selected by default.
- Uses searchable picker UI for select-style candidate form fields.
- Keeps SIM and medical history fields inside the candidate identity section and captures additional education details for entry year, graduation year, school address, and grade/IPK.
- Requires at least one family history row and supports adding multiple family members with relationship, name, education, occupation, and workplace fields.
- Requires at least one social media account and supports adding multiple social media rows.
- Captures multiple organization or training experiences with organization name, role, and period fields.
- Supports up to five work experience entries, matching the current backend schema.

Expected future recruitment capabilities:

- Job filtering
- Applicant tracking
- CV upload
- Interview workflow
- HR dashboard
