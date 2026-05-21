# Frontend Architecture

## Recommended Stack

- Next.js App Router
- React Server Components
- ISR/SSG for SEO
- Tailwind CSS
- shadcn/ui

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
