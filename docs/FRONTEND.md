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
- Candidate applications are implemented at `frontend/app/career/page.tsx`.
- Candidate FAQs are implemented as a standalone page at `frontend/app/faq-kandidat/page.tsx`, loaded from `GET /api/extl/v1/faqs`, displayed as an accordion with the first FAQ open by default, and retain the public menu and footer.
- The first viewport follows the HGS reference direction: black navigation, split hero layout, logistics/staff imagery, dark copy panel, large serif headline, script accent word, rounded CTA, social buttons, and HGS logo placement.
- The About HGS landing section fills the available viewport height beneath the sticky header.
- The Social Media landing section fills the available viewport height beneath the sticky header.
- The Contact landing section fills the available viewport height beneath the sticky header with office contact details and an embedded map in a two-column desktop layout.
- Local brand and hero visuals live in `frontend/public/images/`.
- The hero currently supports WebP image slides and MP4 video slides through the slide data in `frontend/app/page.tsx`.
- Browser-side EXTL API calls are same-origin by default through the Next.js `/api/:path*` rewrite.
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
- Loads public jobs and divisions from the EXTL API when available.
- Submits candidate payloads to `POST /api/extl/v1/career-applications`.
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
