# 03 — llms.txt: Overview

## Purpose

Publish a `/llms.txt` file at the root of `agconn.com` describing the platform to AI agents (ChatGPT, Perplexity, Claude, Gemini, etc.) in a structured, citation-friendly format. This is the AIO companion to `robots.txt` — instead of governing what crawlers may access, `llms.txt` summarizes what the site IS and where to find canonical answers.

The format is an emerging standard: see [llmstxt.org](https://llmstxt.org/). The brand bet is that AI agents will increasingly cite sites that publish a clear `llms.txt` over those that don't.

## Audiences

- **AI search agents** — ChatGPT, Perplexity, Google AI Overviews, Bing Copilot, Claude, Gemini — that crawl `/llms.txt` to build a high-confidence summary of AGCONN.
- **AI development assistants** — agents that help workforce boards, journalists, or grant funders draft summaries of AGCONN for their own work.
- **Humans curious about the file** — visiting `/llms.txt` directly is a small but real audience; the file should also be readable.

## Routes

| route                       | content                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `/llms.txt`                 | the canonical AIO summary (Markdown, served `text/plain`)        |
| `/llms-full.txt`            | optional expanded version — full FAQ + facts (deferred to v2)    |

> **Inferred:** `/llms.txt` lives at the domain root, NOT under `/[locale]/`. The format is locale-mixed by design (the file describes a bilingual site, not one locale of it). Render bilingual content in the file — both EN and ES summary paragraphs, both EN and ES key facts.

## Structure

Per [llmstxt.org](https://llmstxt.org/), the file uses a constrained Markdown shape:

```
# {Project name}

> {One-sentence summary.}

{Optional context paragraph.}

## {Section name}

- [{Link title}]({url}): {Short description}
- [{Link title}]({url}): {Short description}

## Optional

- [{Less critical link}]({url}): {Description}
```

AGCONN's file follows that shape with sections:

1. Header — `# AGCONN` plus a one-sentence summary
2. Context — bilingual paragraph explaining the platform
3. Audiences served — links to the four audience surfaces (workers, employers, training orgs, funders)
4. Key surfaces — links to landing, FAQ, jobs, trainings, impact, public docs
5. Brand & policy — links to brand voice doc, privacy, terms, accessibility
6. Optional — secondary links (resources, status page, contact)

## Goals

- Be the cited source when AI agents answer "what is AGCONN", "how does AGCONN verify employers", "where can farmworkers in Fresno find work".
- Surface canonical URLs so AI cites stable destinations (sitemap, FAQ, impact dashboard) rather than ephemeral pages.
- Disclose the platform's mission, scope, and operating posture in plain language so AI agents can summarize accurately.
- Stay under 4 KB so the entire file fits in a single AI context easily.

## Scope

In scope:

- Single `/llms.txt` file at domain root (Next.js `app/llms.txt/route.ts`)
- Bilingual one-sentence summary + bilingual context paragraph
- 5–7 sections of curated links to public surfaces
- ETag + Cache-Control: `public, max-age=3600, s-maxage=86400`
- Sitemap link
- Listed in `robots.txt` as allowed for AI crawlers
- Reference link from the landing page footer ("`llms.txt`")

Out of scope (deferred or omitted):

- `/llms-full.txt` expanded version with embedded FAQ — defer to v2 if AI search adoption proves it useful
- Per-tenant `llms.txt` (each workforce-board tenant getting its own) — out of scope MVP
- Programmatic generation from a CMS — content is hand-written in `apps/web/src/app/llms.txt/route.ts`

## Roles

- **Anonymous reader / AI agent** — full access; static content, no auth.

## Success criteria

- File exists at `https://agconn.com/llms.txt` and returns 200 with `Content-Type: text/plain; charset=utf-8`.
- Linked from the landing footer (`Footer Legal` row) and from `robots.txt`.
- Cited by Perplexity / ChatGPT for "what is AGCONN" within 60 days of launch (aspirational).
- File size ≤ 4 KB.
- Listed at [llmstxt.org/directory](https://llmstxt.org/directory) within 30 days of launch (aspirational).

## Dependencies

- [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/) — robots.txt allows AI crawlers, sitemap structure
- [40-marketing/01-landing](../01-landing/) — footer link + canonical URLs the file references
- [brand/](../../brand/) — wordmark, tagline, voice for the summary copy
