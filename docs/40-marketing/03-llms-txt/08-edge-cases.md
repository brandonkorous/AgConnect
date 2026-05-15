# 03 — llms.txt: Edge Cases & Risks

## Domain rebrand

The product may rebrand from "AGCONN" before launch (the `.com` may not be available — see [01-landing/08-edge-cases.md](../01-landing/08-edge-cases.md)).

**Mitigation:**

- Body content references `process.env.NEXT_PUBLIC_SITE_URL` — domain swap is an env var change.
- Product name "AGCONN" appears literally in the file. On rebrand, edit the route file directly. One PR, one merge, ISR revalidates.
- Platform description ("bilingual workforce platform connecting Central Valley farmworkers...") stays valid regardless of name.

## Stale links

Links in `/llms.txt` go stale when routes are renamed (`/[locale]/jobs` → `/[locale]/buscar` for Spanish, etc.).

**Mitigation:**

- Quarterly review of every URL in the file (add to `40-marketing` ops checklist).
- Pre-launch: run an automated link-check (next-link-check or similar) as part of the `llms.txt` build verification.
- Routes that are deliberately bilingual (`/es/trabajos` vs `/en/jobs`) need both URLs listed in the file, OR one canonical with hreflang in the destination handling redirects.

## File grows past 4 KB

If the file accumulates too many links, it stops fitting comfortably in a single AI-agent fetch.

**Mitigation:**

- 4 KB is the soft cap. At 6 KB, split: `/llms.txt` becomes the index, `/llms-full.txt` adds depth (FAQ inline, longer descriptions).
- Trim quarterly; remove links that AI agents don't actually cite.

## AI crawler ignores the file

Worst case: nobody reads `/llms.txt` and the investment doesn't pay off in citations.

**Mitigation:**

- Ship anyway — the file is < 100 lines and zero ongoing cost.
- Adoption is increasing across the AI search space; the bet is asymmetric (low cost, potentially high upside).
- Track: monthly Perplexity / ChatGPT search for "what is AGCONN"; note whether the answer cites our domain. If after 90 days no citation, deprioritize but keep the file.

## Hand-edited file diverges from site reality

Body claims AGCONN serves five counties, but a tenant launches and adds a sixth. The file says "Free plan = 2 active postings", but pricing changes to 3.

**Mitigation:**

- Treat `/llms.txt` as marketing content with a quarterly review cadence.
- Add a `LAST_UPDATED` line at the bottom of the file (e.g., `_Last reviewed: 2026-04-29_`) so AI agents (and humans) know its freshness.
- Long-term: extract the dynamic facts (county list, pricing) into a config object that both the site and `/llms.txt` consume.

> **Inferred:** Pulling pricing from a config makes the file self-updating but adds runtime complexity. v1 hand-edits; v2 considers the config approach if drift becomes a real problem.

## Crawler abuses the file as a sitemap

Some crawlers may treat the linked URLs in `/llms.txt` as a substitute sitemap and crawl them aggressively.

**Mitigation:**

- The actual `sitemap.xml` is the canonical crawl directive; `/llms.txt` lists ~10 URLs vs sitemap's potentially thousands.
- Application-level rate limiting handles any abuse.
- No mitigation needed at the file level.

## Malicious content injection

Hand-edited content lives in source code; PR review catches injection attempts. The file does NOT consume any user-generated input.

**Risk:** zero from input, low from typos. Protect by treating the route file as security-sensitive in code review.

## Server-rendered content mismatches static expectations

The route runs server-side and interpolates `SITE`. If the env var is set incorrectly in production (e.g., `localhost:3000`), AI crawlers index broken links.

**Mitigation:**

- Smoke test on every deploy: `curl https://agconn.com/llms.txt | grep -c "agconn.com"` — must be ≥ 5.
- Add to deploy checklist; gate release on smoke test passing.

## Locale routing applied accidentally

Next.js's i18n middleware would normally rewrite `/llms.txt` to `/es/llms.txt`. We need it at the root.

**Mitigation:**

- `apps/web/src/middleware.ts` matcher excludes `/llms.txt`, `/sitemap.xml`, `/robots.txt`, `/og/*` from locale rewriting.
- Verified by integration test: `GET /llms.txt` (no locale prefix) returns the file, not a redirect.

## Open questions

1. **`/llms-full.txt` expanded version** — when does the simple 4 KB version stop being enough? Add the expanded file when a real-world AI agent demonstrably benefits.
2. **Per-tenant `llms.txt`** — when a workforce-board tenant runs their own AGCONN instance, do they get their own `/llms.txt`? Out of scope MVP; reconsider if multi-tenant marketing surface ships.
3. **Markdown formatting variants** — some llmstxt.org examples use `## Pages` instead of `## Surfaces`. Watch the spec; adjust if the de-facto format changes.
