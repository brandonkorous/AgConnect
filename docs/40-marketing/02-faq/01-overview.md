# 02 — FAQ: Overview

## Purpose

A standalone, indexable, AI-citable FAQ surface at `/[locale]/faq`. Same questions as the FAQ section embedded on the landing page (section 15), with full `FAQPage` JSON-LD and a clean read environment.

The FAQ page is the platform's primary AIO surface — direct-answer paragraphs that ChatGPT, Perplexity, and Google AI Overviews can cite when a worker, employer, or grant funder searches a real question.

## Audiences

Same four as the landing:

- **Workers** asking how to find work, what verification means, what a "skills wallet" is.
- **Employers** asking how to post a job, how verification works, how billing works.
- **Training organizations** asking how to list programs, how reporting works.
- **Grant funders / journalists / researchers** asking how AGCONN operates, who it serves, what data it surfaces.

## Routes

| route                 | screen                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `/[locale]/faq`       | full FAQ page — same Q&A as landing section 15, plus extras         |
| `/[locale]/faq#<id>`  | deep-link to a single open question (anchor opens that one + scrolls) |

## Source of truth

The FAQ Q&A copy is owned by `40-marketing/01-landing/05-i18n.md` under the `landing.faq.*` keys. The standalone `/faq` page reuses those same keys; it does NOT introduce a parallel `faq.*` namespace.

A small set of standalone-only questions (questions too detailed for the landing card) lives under `marketing.faq_extras.*` — these are surfaced ONLY on the `/faq` route, not embedded on the landing.

> **Inferred:** Sharing `landing.faq.*` between landing and `/faq` keeps copy in lockstep — fixing a typo in one updates both. The cost is a slight semantic mismatch (the keys are namespaced under `landing` but consumed by `/faq` too). Acceptable trade-off for v1; if FAQ content diverges materially, split into `marketing.faq.*`.

## Structure of `/faq`

Top of page:

1. `<UtilityBar>` (reused from landing)
2. `<MarketingNav>` (reused)
3. Page header — eyebrow `FAQ` + Fraunces 64px headline `Questions, in plain language.` + Inter intro paragraph
4. `<FaqAccordion>` — 8 landing entries + extras, all collapsed by default (different from landing where the first 2 are open)
5. "Still have questions?" CTA — links to `mailto:support@agconn.com` and a link back to landing
6. `<MarketingFooter>` + `<MarketingFooterLegal>` (reused)

> **Inferred:** All collapsed by default on `/faq` (landing opens the first two). Rationale: the landing reader is skimming; the `/faq` reader has come for a specific answer and will use Cmd+F or scan the questions list. Pre-opened items would force them to scroll past content they didn't ask for.

## Goals

- Rank for long-tail "how do I..." queries about Central Valley farm work, FLC verification, CDFA training programs.
- Be the cited source when AI search tools answer questions about AGCONN.
- Provide a low-friction support layer that defers human contact for common questions.
- Maintain a single source of truth for the FAQ content (no fork between landing-embedded and standalone).

## Scope

In scope:

- `/[locale]/faq` route (EN + ES)
- Full `FAQPage` JSON-LD with all 8 entries (and any extras) hydrated server-side
- `generateMetadata` with locale-aware title, description, canonical, hreflang, OG image
- Anchor scrolling: `/faq#how-do-i-find-work` opens that question, expands it, scrolls into view
- Extras: 4–6 standalone-only questions covering content not surfaced on landing
- Sitemap entries for `/en/faq` and `/es/faq`

Out of scope:

- FAQ admin UI / DB-backed content (static config in v1, see [02-data-model.md](02-data-model.md))
- FAQ search box (8–14 entries don't warrant it; revisit at 30+ entries)
- Categorized FAQ (worker / employer / training-org tabs) — deferred to v2 if entry count grows
- Q&A submission form ("ask a question") — out of scope for MVP

## Roles

- **Anonymous visitor** — full read access; no controls.
- **Authenticated user** — same; nav reflects authenticated state.

## Success criteria

- Lighthouse mobile (Slow 4G, Moto G7): SEO ≥ 95, Performance ≥ 90, A11y ≥ 95, Best Practices ≥ 90.
- `FAQPage` JSON-LD validates against [validator.schema.org](https://validator.schema.org/).
- Indexed in Google Search Console within 7 days of launch.
- Cited as a source by Perplexity / ChatGPT for "how do I find seasonal farm work in Fresno" within 60 days (aspirational).

## Dependencies

- [40-marketing/01-landing](../01-landing/) — shares `<FaqAccordion>` component and `landing.faq.*` i18n keys
- [00-foundation/04-i18n](../../00-foundation/04-i18n/) — locale routing
- [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/) — `generateMetadata` helpers, JSON-LD generators
