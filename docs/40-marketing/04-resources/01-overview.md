# 04 — Resources: Overview

## Purpose

Long-form bilingual content under `/[locale]/resources/...` — articles, guides, and explainers that build SEO authority and answer the deeper questions AI search tools cite.

The Resources surface is the platform's third AIO leg (alongside `/faq` for short answers and `/llms.txt` for site summary). It targets long-tail queries that demand narrative answers — "how the H-2A visa interacts with seasonal farmwork in California", "what FLC verification actually checks", "how to read a CDFA training program prospectus".

## Audiences

- **Workers** — searching for rights guides, wage explanations, training program walk-throughs
- **Employers** — searching for FLC compliance how-tos, Pro plan guides, hiring best practices
- **Training organizations** — searching for grant-reporting walkthroughs, capacity planning
- **Grant funders / journalists / researchers** — searching for impact analyses, policy posture
- **Search engines and AI agents** — indexing authoritative bilingual content

## Routes

| route                                     | screen                                                           |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `/[locale]/resources`                     | resources index — sortable list of all articles by category      |
| `/[locale]/resources/[slug]`              | individual article (MDX-rendered)                                |
| `/[locale]/resources/category/[category]` | filtered index by category                                       |

## Status: deferred build, spec'd now

Per [PROJECT-PLAN.md](../../PROJECT-PLAN.md), Resources is named scope for `40-marketing` but is **not on the launch checklist for 2026-05-05**.

**v1 launch posture:**

- Build the `/[locale]/resources` route handler that 404s gracefully (or renders an empty-state "Coming soon — articles launching post-launch" page).
- Reserve the URL space — make sure no other feature claims `/resources/...` paths.
- Footer "Resources" link in landing nav routes to the empty-state page (or hides if the empty-state is jarring).
- `llms.txt` mentions `/[locale]/resources` as "rolling out post-launch".
- This spec captures the scope so the post-launch build has a runway.

**v2 (Q3 2026 target):**

- Ship 4–6 high-quality articles, two each in EN/ES.
- MDX-based content pipeline: articles live as `.mdx` files in `apps/web/src/content/resources/`.
- Articles include `Article` JSON-LD, OG images, hreflang, breadcrumbs.
- Sitemap auto-includes every article slug.

## Goals

- Rank for long-tail queries: "what is FLC verification", "Central Valley farmworker rights", "CDFA training programs explained".
- Earn AI citations via depth + freshness — direct-answer articles AI agents can paraphrase from.
- Establish editorial authority that converts search traffic to platform sign-ups.
- Maintain bilingual parity (every article ships EN + ES at the same time).

## Scope

In scope (v1):

- Route reservation: `/[locale]/resources` index page returning 200 with empty-state copy
- Footer link wired (hidden if empty-state lands jarring; otherwise visible)
- This spec doc set

In scope (v2):

- MDX-based article system (file-based, no DB)
- `Article` schema JSON-LD per article
- Per-article OG image
- RSS feed (`/[locale]/resources/feed.xml`)
- Article index with category filter
- Reading-time estimate, author byline, last-updated date

Out of scope:

- DB-backed CMS — file-based MDX is sufficient until article cadence exceeds quarterly
- Comments / engagement features — readers email support@agconn.com if they want to discuss
- Author pages / multi-author hub — single editorial voice for v2
- Newsletter signup tied to articles — handled by waitlist endpoint
- Translation workflow tooling — articles are written native-bilingual or translated by the editor before publish (no machine translation)

## Roles

- **Anonymous reader** — full read access; no controls.
- **Authenticated user** — same; nav reflects authenticated state.
- **Editor (post-launch)** — writes new MDX files, opens PR, ships through normal review.

## Success criteria (v2 — deferred)

- 4–6 published articles by 2026-08-31 (Q3 target).
- Lighthouse SEO ≥ 95 on every article.
- At least one article ranks on Google's first page for its target query within 90 days of publish.
- AI search citation for at least one article within 60 days.
- 100% bilingual parity — every EN article has an ES counterpart.

## Dependencies

- [00-foundation/04-i18n](../../00-foundation/04-i18n/) — locale routing
- [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/) — `Article` JSON-LD, sitemap inclusion
- [40-marketing/01-landing](../01-landing/) — shares marketing layout (`(marketing)/layout.tsx`) and chrome
- MDX runtime (`@next/mdx` or `next-mdx-remote`) — added in v2
