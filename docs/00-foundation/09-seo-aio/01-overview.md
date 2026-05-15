# 09 — SEO & AIO: Overview

## Purpose

AGCONN must rank well in Google for job seekers and employers searching in the Central Valley, AND be discoverable / citable by AI search tools (ChatGPT, Perplexity, Google AI Overviews) — a capability category the kickoff calls AIO (AI Optimization). See kickoff §13.

## What's covered

- **Technical SEO**: metadata, sitemap, robots, structured data, Core Web Vitals, hreflang
- **Content SEO**: SEO slugs, FAQ schema, authority pages
- **AIO**: llms.txt, answer-format content, entity clarity, no AI crawler blocks

## Phased work

Per the kickoff, SEO/AIO is Phase 5 — applied across all features after they ship. This doc captures the standards each feature must follow when its public-facing pages are built. Per-feature `04-ui.md` files reference the conventions here.

## Public surfaces

| surface                                               | SEO priority                     |
| ----------------------------------------------------- | -------------------------------- |
| Landing page (`/[locale]`)                            | high                             |
| Job postings (`/[locale]/jobs/[slug]`)                | very high — the keyword business |
| Training programs (`/[locale]/training/[slug]`)       | high                             |
| Employer profile pages (`/[locale]/employers/[slug]`) | medium                           |
| FAQ (`/[locale]/faq`)                                 | high — AIO surface               |
| Blog / resources (`/[locale]/resources/...`)          | medium-long-term                 |
| llms.txt (`/llms.txt`)                                | AIO-specific                     |
| Sign-in, onboarding, dashboard                        | none (noindex)                   |

## Stack-specific approach

- **Next.js Metadata API** for every page (`generateMetadata`).
- **Static metadata** for stable pages; **dynamic** for entity pages (jobs, training, employers).
- **JSON-LD** rendered server-side for every entity page using @vercel/og or Next's `<Script type="application/ld+json">`.
- **Sitemap** dynamic (`apps/web/app/sitemap.ts`) revalidated hourly.
- **Robots.txt** at `apps/web/app/robots.ts` — allow public, disallow admin/api.
- **OG images** generated per-page via `@vercel/og` (edge runtime) for low-latency social shares.

## AIO-specific tactics (kickoff §13.2)

- **FAQ pages** with `FAQPage` JSON-LD covering the questions AI tools answer ("how to find seasonal farm work in Fresno", etc.)
- **Authority content** — bilingual articles on farmworker rights, FLC compliance, CDFA training programs
- **Entity clarity** — `Organization` schema on every page; consistent NAP in footer
- **Descriptive bilingual alt text** — AI tools use alt text for content understanding
- **`/llms.txt`** — emerging standard summarizing the platform for AI agents
- **Answer-format content** — direct-answer paragraphs near the top of key pages
- **No AI crawler blocks** — GPTBot, PerplexityBot, ClaudeBot, etc. allowed in robots.txt

## Scope

In scope:

- Per-feature page metadata via `generateMetadata`
- Sitemap + robots + llms.txt generation
- JSON-LD on jobs, training, employers, organization
- OG image generation per page
- hreflang tags for EN/ES variants
- FAQ page with FAQPage schema
- Core Web Vitals targets enforced in CI
- Entity / NAP footer component

Out of scope:

- Multi-language slug pairs (`seo_slug_en` and `seo_slug_es` separately) — only `seo_slug` for MVP
- AB testing of titles
- Content marketing pipeline / blog CMS
- Paid SEM coordination

## Success criteria

- All MVP public pages have valid metadata, structured data, and pass `validator.schema.org`.
- Lighthouse SEO score ≥ 95 on every public page.
- LCP < 2.5s, CLS < 0.1, INP < 200ms (Core Web Vitals "Good") on mobile 4G.
- Pages indexed in Google within 7 days of publish (verified via Search Console).
- AI search citations: AGCONN cited by Perplexity / ChatGPT for "find seasonal farm work in Fresno" within 60 days of launch (aspirational).

## Dependencies

- [04-i18n](../04-i18n/) — hreflang, locale-aware metadata
- [10-infra-cicd](../10-infra-cicd/) — Lighthouse CI gating
- Every feature with public pages — they call into this layer's helpers
