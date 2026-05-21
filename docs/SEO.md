# SEO Strategy

For an HGS-style corporate website, use:

- SSR/SSG with Next.js
- `sitemap.xml`
- `robots.txt`
- `schema.org`
- OpenGraph tags
- Dynamic metadata
- Image optimization
- CDN caching

## Media Assets

- Prefer correctly named WebP assets for photographic images.
- Keep original JPEG files only as fallbacks or source files, not as primary page references.
- Add descriptive `alt`, `width`, and `height` attributes for meaningful images.
- Use `loading="lazy"` for non-primary images and eager/high priority loading for first-viewport hero media.
- Use a WebP poster image for autoplay hero video and keep video preload at `metadata`.
- When video transcoding tools are available, add a WebM/AV1 source before MP4 for smaller modern delivery.
