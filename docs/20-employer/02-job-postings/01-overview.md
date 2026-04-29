# 02 — Job Postings: Overview

## Purpose

Verified employers create, publish, edit, and close bilingual job postings. The data they enter powers everything in [10-worker/03-job-discovery](../../10-worker/03-job-discovery/) and [10-worker/04-application-tracker](../../10-worker/04-application-tracker/).

## Employer journey

1. Employer (verified) goes to dashboard → "+ New posting".
2. Form: title (EN+ES), description (EN+ES), county, wages, dates, required skills.
3. Save as draft anytime; preview as a worker would see.
4. Publish when ready.
5. Edit (limited) after publish; close when filled.

## Bilingual requirement

Every public-facing string MUST be entered in both EN and ES. The form enforces this at submit. Optionally, the employer can use a "Translate this for me" button (LLM-assisted) to seed the second language; they must still review and confirm.

> **Inferred:** LLM-assisted translation hugely lowers the friction for English-only employers but introduces translation quality risk. Make the translated text visibly editable — the employer's review pass is the safeguard.

## Scope

In scope:

- Create / edit / publish / close postings
- Draft state with autosave
- Plan-tier limits (free = 2 active postings, pro = unlimited, enterprise = unlimited + multi-county)
- Public listing + detail (consumed by job-discovery)
- Bilingual content with optional LLM translation
- Required skills picker (default tags + custom)
- Soft-delete + close transitions

Out of scope:

- Job templates / clone-from-existing — Phase 2 (high value but not MVP)
- Wage benchmarks / suggestions — Phase 3
- Boost / promote (paid feature) — Phase 3
- Multi-language beyond EN/ES — out of scope
- Application question forms / screening — out of scope

## Roles

- **Employer (verified):** create, edit, publish, close their own postings.
- **Worker:** read public postings (job-discovery feature).
- **Admin:** moderate / take down inappropriate postings.

## Success criteria

- Median time from "+ New posting" to "Published" < 8 minutes (with translation help).
- 95% of postings have non-trivial bilingual content (≥ 50 chars in each language).
- Zero postings published by unverified employers (gated).
- Free-plan posting cap enforced atomically (no overshoot from race).
- Listings page LCP < 2.5s.

## Dependencies

- [01-flc-verification](../01-flc-verification/) — gate on publish
- [05-subscription-billing](../05-subscription-billing/) — plan-tier limits
- [10-worker/03-job-discovery](../../10-worker/03-job-discovery/) — consumer
- [00-foundation/04-i18n](../../00-foundation/04-i18n/) — bilingual columns
- [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/) — slug + JSON-LD
- LLM (optional) for translation help — same Anthropic SDK as resume-parser
