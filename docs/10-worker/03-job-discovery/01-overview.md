# 03 — Job Discovery: Overview

## Purpose

Help workers find jobs that match their county, skills, and availability — quickly, in their language, on a low-bandwidth phone. Workers can save searches and get SMS alerts when new matching jobs are posted.

## User goals

- See jobs near me (county-first).
- Filter by skill, wage, start date.
- Save a search → get notified when new matches appear.
- Open a job → understand it in 10 seconds → decide whether to apply.

## Scope

In scope:

- Public-facing job listing (`/[locale]/jobs` or `/[locale]/trabajos`)
- Per-job detail page (`/[locale]/jobs/[slug]`)
- Filters: county, skill, wage range, start date, employer
- Search: free-text against bilingual FTS index
- Saved searches with SMS alert opt-in
- Recommended jobs on the worker dashboard (county + skill match)
- SEO: indexable job pages with `JobPosting` JSON-LD

Out of scope:

- Map view of jobs (Phase 2)
- Distance-from-zip filtering (Phase 2 — requires geocoding pipeline)
- Saved jobs (bookmark) without alert subscription (Phase 2 — overlaps with saved search)
- Email alerts (SMS-only for MVP — workers' primary channel)

## Roles

- **Worker (authenticated):** all features above; saved searches with alerts.
- **Anonymous (unauthenticated):** can browse public job pages and listing (SEO-friendly), but cannot save searches or apply (must sign in to apply).

## Success criteria

- Median time-to-first-application from landing on `/jobs` < 90 seconds.
- ≥ 50% of authenticated workers create at least one saved search within 14 days of onboarding.
- Job detail page LCP < 2.5s on mobile 4G.
- Saved-search SMS alerts arrive within 5 minutes of a matching job being posted (excluding quiet hours).
- ≥ 80% of search queries return results in < 200ms (P95).

## Dependencies

- [20-employer/02-job-postings](../../20-employer/02-job-postings/) — produces the data
- [00-foundation/04-i18n](../../00-foundation/04-i18n/) — bilingual FTS column generation
- [00-foundation/05-sms-pipeline](../../00-foundation/05-sms-pipeline/) — alert delivery
- [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/) — public-page SEO
- [10-worker/04-application-tracker](../04-application-tracker/) — apply flow
