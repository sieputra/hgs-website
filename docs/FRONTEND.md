# Frontend Architecture

## Recommended Stack

- Next.js App Router
- React Server Components
- ISR/SSG for SEO
- Tailwind CSS and shadcn/ui remain the intended UI stack as the app grows.
- The first frontend implementation uses plain global CSS in the Next.js app so the visual direction can be established before adding component libraries.

## Current Implementation

- The frontend lives in `frontend/`.
- The initial public page is implemented with Next.js App Router at `frontend/app/page.tsx`.
- The first viewport follows the HGS reference direction: black navigation, split hero layout, logistics/staff imagery, dark copy panel, large serif headline, script accent word, rounded CTA, social buttons, and HGS logo placement.
- Local brand and hero visuals live in `frontend/public/images/`.

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

Expected future recruitment capabilities:

- Job filtering
- Applicant tracking
- CV upload
- Interview workflow
- HR dashboard
