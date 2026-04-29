# 04 — Worker Search: Overview

## Purpose

Pro+ employers can proactively search the verified worker pool by skill, county, availability, and certifications. They can DM (Phase 2) or invite a worker to apply to one of their postings.

This is gated behind the **Pro** subscription tier (per kickoff §10).

## Employer journey

1. Pro employer goes to `/employer/workers` → search interface.
2. Filter by skill, county, certification, availability.
3. See result cards with first name + last initial, skill match, certifications.
4. Tap a worker → preview profile (redacted: phone hidden until interaction).
5. "Invite to apply" CTA — pre-selects worker for one of the employer's open postings, sends invite SMS.

## Scope

In scope:

- Search the verified worker pool (workers with `onboardedAt != null`)
- Filters: county, skills, certifications, availability (day/AM-PM)
- Pagination
- Profile preview (redacted)
- "Invite to apply" flow (creates a special application + invite SMS)
- Plan-tier gating (Pro+ only)
- Search analytics

Out of scope:

- Direct messaging (Phase 2)
- Saved worker shortlists (Phase 2)
- Boolean / advanced query syntax — chip-based filtering only
- Cross-tenant worker search

## Roles

- **Employer (Pro+):** full search.
- **Employer (Free):** see "Upgrade to Pro" gate; cannot search.
- **Admin:** full access for grant analysis.

## Privacy posture

- Worker contact info (phone, email, exact address) NEVER appears in search results.
- After "invite to apply" → worker accepts → application created → contact info exposed (same rules as normal apply flow).
- Workers can opt out of being searchable via a profile setting (Phase 2 — for MVP, all onboarded workers are searchable).

> **Inferred:** Privacy default for MVP is "all onboarded workers searchable, but contact info never visible without an application." This is stricter than typical job boards (where employers see contact info on signup) and matches the platform's farmworker-trust positioning.

## Success criteria

- ≥ 30% of Pro employers use search at least once a month.
- "Invite to apply" conversion: ≥ 20% of invited workers apply within 7 days.
- No PII leaked: workers' phone/email never returned by search endpoints.
- Search P95 latency < 300ms with 10k workers.

## Dependencies

- [01-onboarding](../../10-worker/01-onboarding/) — worker pool source
- [02-job-postings](../02-job-postings/) — invite target postings
- [05-subscription-billing](../05-subscription-billing/) — plan gating
- [00-foundation/05-sms-pipeline](../../00-foundation/05-sms-pipeline/) — invite SMS
