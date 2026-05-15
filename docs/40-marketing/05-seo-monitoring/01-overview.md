# 05 — SEO & AIO monitoring

Post-launch runbook for keeping AGCONN's marketing surface healthy in search and AI indexes. Operational, not aspirational — every check on this page is something an on-call human runs or reads, not a goal we hope to hit.

## Purpose

AGCONN ships with a strong SEO/AIO foundation: bilingual hreflang, JSON-LD coverage across `Organization`, `WebSite`, `FAQPage`, `BreadcrumbList`, `JobPosting`, `EducationalOccupationalProgram`, `Article` (with `Speakable` + `reviewedBy`), `Dataset`, `NewsArticle`; dynamic OG cards per page; `/llms.txt` + `/llms-full.txt`; IndexNow on deploy; Lighthouse CI gating. None of that stays healthy on its own.

The cadences below are what we own to *keep* it healthy.

## Owners

- Marketing engineering — files in [apps/web/src/lib/seo/](apps/web/src/lib/seo/), [apps/web/src/app/llms.txt/](apps/web/src/app/llms.txt/), [apps/web/src/app/og/](apps/web/src/app/og/), [apps/web/src/app/sitemap.ts](apps/web/src/app/sitemap.ts), [apps/web/src/app/robots.ts](apps/web/src/app/robots.ts).
- Operations — Google Search Console, Bing Webmaster Tools, IndexNow key rotation, Lighthouse CI alerts.

## Weekly checks

Run every Monday. Should take under 20 minutes when nothing's wrong.

### 1. Search Console crawl errors

- **What:** Go to [search.google.com/search-console](https://search.google.com/search-console) → AGCONN property → Pages.
- **Look for:** Any new `Crawled — currently not indexed` or `Discovered — currently not indexed` entries on marketing URLs. Soft 404s. Spike in `Server error (5xx)` or `Redirect error`.
- **Threshold:** Any new error on a Tier-1 URL (landing, /faq, /pricing, /impact, /workers, /employers, /jobs/*, /training/*) is P1. Errors on legal pages are P3.
- **Fix path:** Rerun the crawl from Search Console after the fix. If the URL is gone on purpose, add it to the `disallow` list in [apps/web/src/app/robots.ts](apps/web/src/app/robots.ts).

### 2. Hreflang validation

- **What:** Paste `https://agconn.com/sitemap.xml` into [technicalseo.com/tools/hreflang/](https://technicalseo.com/tools/hreflang/) or [Merkle's hreflang tool](https://www.merkle.com/sites/default/files/hreflang-tags-testing-tool.html).
- **Look for:** Missing return links. EN→ES alternates that resolve to 404. Pages that emit hreflang for `en` but not `es` (or vice versa).
- **Source of truth:** [apps/web/src/lib/seo/metadata.ts](apps/web/src/lib/seo/metadata.ts#L29-L60) emits `alternates.languages`. The sitemap mirrors it.

### 3. Core Web Vitals (field data)

- **What:** Search Console → Core Web Vitals. Also [pagespeed.web.dev](https://pagespeed.web.dev/) for spot checks.
- **Look for:** LCP > 2.5s on any Tier-1 URL. CLS > 0.1. INP > 200ms.
- **Lighthouse CI** ([.lighthouserc.json](.lighthouserc.json)) gates PR-level regressions in lab data; this check catches field data drift Lighthouse can't see (real devices, real networks).
- **Threshold:** A Tier-1 URL flipping from "Good" → "Needs improvement" is P2; flipping to "Poor" is P1.

### 4. `/llms.txt` + `/llms-full.txt` fetch logs

- **What:** Cloudflare logs / nginx-ingress logs for `path=/llms.txt`, `path=/llms-full.txt`.
- **Look for:** Spike (good — new bot picked us up) or drop (file broken). 4xx/5xx responses (route handler error). User-Agent distribution — `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `anthropic-ai` should all show up over a week.
- **Threshold:** Any 5xx on these routes is P1 — the file is supposed to be cached and static.

### 5. AI bot share of traffic

- **What:** Same log source. Group requests by user agent.
- **Look for:** Trend over time. Bot share that doubles week-over-week may signal we got cited in a model release (good) or that we're being scraped abusively (less good).
- **Defensive ceiling:** If a single bot exceeds 30% of total marketing traffic for >24 hours, throttle in `robots.txt`.

## Monthly checks

Run on the first business day of the month.

### 6. JSON-LD rich-result validation

- **What:** [search.google.com/test/rich-results](https://search.google.com/test/rich-results) for one URL of each schema type:
  - Landing: `Organization` + `WebSite`
  - /faq: `FAQPage`
  - /impact: `Dataset`
  - /jobs/{any-slug}: `JobPosting`
  - /training/{any-slug}: `EducationalOccupationalProgram`
  - /resources/{any-slug}: `Article` + `Speakable`
  - /press/{any-slug}: `NewsArticle`
  - Any nested marketing page: `BreadcrumbList`
- **Source of truth:** [apps/web/src/lib/seo/json-ld.ts](apps/web/src/lib/seo/json-ld.ts).
- **Threshold:** Any "Critical issue" or "Non-critical issue" → file a ticket. Schemas that newly fail Google's parser get dropped from rich results silently.

### 7. JobPosting Google Jobs eligibility

- **What:** Search `site:agconn.com/jobs/` on Google. Cross-check the count against the `getAllJobs` count in our DB.
- **Look for:** Big delta = many postings are getting dropped by Google Jobs. Most common cause: missing `validThrough`, `baseSalary`, or unverified `hiringOrganization`.
- **Defensive measure:** The `jobPostingJsonLd` helper at [apps/web/src/lib/seo/json-ld.ts](apps/web/src/lib/seo/json-ld.ts) sets a 30-day default `validThrough` when the employer doesn't pin one — keeps postings from silently aging out.

### 8. NAP consistency

- **What:** Verify the Organization JSON-LD (`name`, `address`, `contactPoint[]`) matches the marketing footer ([apps/web/src/components/marketing/MarketingFooter.tsx](apps/web/src/components/marketing/MarketingFooter.tsx)) and Google Business Profile, if active.
- **Threshold:** Any drift between three surfaces (JSON-LD, footer, GBP) is P3 — fix on next deploy.

## On-demand checks

### 9. After publishing a new resource article

The deploy workflow pings IndexNow automatically — see [scripts/indexnow-ping.mjs](scripts/indexnow-ping.mjs) and the `Ping IndexNow` step in [.github/workflows/deploy.yml](.github/workflows/deploy.yml). Verify in the deploy logs that the ping succeeded (status 200 or 202). If IndexNow is misconfigured, the script soft-fails and prints `[indexnow] skipping`.

To trigger manually:

```bash
INDEXNOW_KEY=<key> \
INDEXNOW_KEY_LOCATION=https://agconn.com/indexnow-key.txt \
SITE_URL=https://agconn.com \
node scripts/indexnow-ping.mjs
```

### 10. After changing the brand voice or pricing

The `/llms-full.txt` corpus is hardcoded in [apps/web/src/app/llms-full.txt/route.ts](apps/web/src/app/llms-full.txt/route.ts) — it does not auto-update from translation seeds. If pricing changes, FAQ entries are added/removed, or the policy stance evolves, update that file in the same PR. AI agents cache `/llms-full.txt` aggressively (24h s-maxage); a stale corpus can persist in their indexes for weeks.

## IndexNow key rotation

The key is served from [apps/web/src/app/indexnow-key.txt/route.ts](apps/web/src/app/indexnow-key.txt/route.ts) using the `INDEXNOW_KEY` env var. To rotate:

1. Generate a new 32-character hex key: `openssl rand -hex 16`.
2. Update the `INDEXNOW_KEY` GitHub Actions secret.
3. Deploy. The new key is live at `https://agconn.com/indexnow-key.txt` after the next deploy.
4. Next deploy's IndexNow ping will use the new key. No registration step — IndexNow validates the key by fetching the key file on the next ping.

## Reference

- Search Console: [search.google.com/search-console](https://search.google.com/search-console)
- Bing Webmaster Tools: [www.bing.com/webmasters](https://www.bing.com/webmasters)
- IndexNow protocol: [www.indexnow.org/documentation](https://www.indexnow.org/documentation)
- Rich Results Test: [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- llmstxt.org spec: [llmstxt.org](https://llmstxt.org/)
- Schema.org reference: [schema.org](https://schema.org/)
- CrUX (Chrome User Experience Report): [developer.chrome.com/docs/crux](https://developer.chrome.com/docs/crux)
