# 04 — Resources: Data Model

## v1: empty-state, no data

The v1 launch route is a static empty-state page. No data model, no DB, no MDX.

## v2: file-based MDX content

Articles live as `.mdx` files in:

```
apps/web/src/content/resources/
  en/
    flc-verification-explained.mdx
    central-valley-farmworker-rights.mdx
    cdfa-training-programs-walkthrough.mdx
  es/
    verificacion-flc-explicada.mdx
    derechos-trabajadores-agricolas-valle-central.mdx
    programas-cdfa-explicados.mdx
```

> **Inferred:** Separate `en/` and `es/` directories — slugs differ between locales (English uses English slugs, Spanish uses Spanish slugs for SEO weight). A shared `slug` field in frontmatter pairs them via hreflang.

### Frontmatter shape

```yaml
---
slug: flc-verification-explained
slugLocale: flc-verification-explained          # this locale's slug
slugAlt:
  es: verificacion-flc-explicada                # other-locale slug for hreflang
title: What FLC verification actually checks
description: A walkthrough of how AgConn verifies that a farm-labor contractor is licensed, current, and matched to the legal entity behind the posting.
category: employer-guides                        # workers-rights | employer-guides | training-explainers | platform
publishedAt: 2026-06-15
updatedAt: 2026-07-02
author: editorial
readingTimeMinutes: 7
heroImage: /images/resources/flc-verification-hero.jpg
heroImageAlt: A clipboard with a California FLC license preview
---
```

### Categories (v2 starter set)

- `workers-rights` — wage law, breaks, transportation, retaliation protections
- `employer-guides` — verification, posting best practices, hiring workflow
- `training-explainers` — what each program actually covers, who qualifies
- `platform` — how AgConn works, FAQs that grew into deep-dives

> **Inferred:** Categories are an enum, not free-text. Adding a category is a code change — keeps the URL space disciplined.

### Article index manifest

```ts
// apps/web/src/content/resources/_manifest.ts (auto-generated at build)
export interface ArticleMeta {
  slug: string;
  locale: 'en' | 'es';
  title: string;
  description: string;
  category: ResourceCategory;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  heroImage?: string;
}

export const articles: Record<'en' | 'es', ArticleMeta[]> = {
  en: [/* ... */],
  es: [/* ... */],
};
```

The manifest is generated at build time by a Node script (`scripts/build-resources-manifest.ts`) that reads every `.mdx` frontmatter in `apps/web/src/content/resources/`. Imported by the article index page and the sitemap.

> **Inferred:** A build-time manifest avoids reading the filesystem in RSC handlers (which doesn't work in edge runtime, complicates ISR). The manifest is a TypeScript module so type-checking catches missing frontmatter fields.

## Reads

- `/[locale]/resources` index → reads the manifest, filters by `locale`
- `/[locale]/resources/[slug]` → reads the individual `.mdx` file via `next-mdx-remote` server component
- `/[locale]/resources/category/[category]` → reads the manifest, filters by `locale` + `category`

## Writes

None. Editors commit MDX files directly via PR.

## Indexes

N/A — file-based.

## RLS

N/A.

## Asset storage

Article hero images and inline images live in `apps/web/public/images/resources/`. Optimized via `next/image` at render time. No CMS / no upload pipeline.

> **Inferred:** Static assets in `public/` are deliberately simple. If image volume grows past ~50 per article, migrate to Azure Blob with `next/image` loader configured. v2 stays in `public/`.
