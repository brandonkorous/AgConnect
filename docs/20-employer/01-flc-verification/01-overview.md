# 01 — FLC Verification: Overview

## Purpose

Verify that employers posting jobs are legitimate. For Farm Labor Contractors (FLCs), this means confirming a current California DIR/DLSE license **and** a current federal DOL MSPA Certificate of Registration. For growers, it means a lighter-weight business attestation. Per kickoff §9.

Worker trust depends on this. Grant reports require demonstrated employer vetting.

## Two employer categories

- **Growers** — direct farm operators. No state license required to hire workers. Verify via business name + EIN + county agricultural commissioner lookup, or SOS business entity search.
- **Farm Labor Contractors (FLC)** — anyone who, for a fee, recruits/hires/transports workers for third-party growers. Requires CA DIR/DLSE FLC license + federal DOL MSPA registration.

## Verification flow

### FLC (automated)

1. Employer signs up as FLC during onboarding.
2. Enters legal name + license number (+ optional federal MSPA cert number).
3. Status: `pending`. `flcCheckStatus` is null until the first auto-check returns.
4. The onboarding handler enqueues a `flc.verify` job to pg-boss.
5. `services/flc-verifier` consumes the job:
   - Hits the CA DLSE Visualforce search at `cadir.my.salesforce-sites.com/RegistrationSearch`, parses the result.
   - Looks up the employer in the local cache of the federal DOL MSPA registry (synced nightly from `data.gov`).
   - Writes a snapshot to `employer_profiles` (status, expiration, MSPA auth flags) and one `verification_log` row per registry.
   - If DLSE returns `Active`, sets `flcVerifiedAt = now()` automatically. Worker dashboard, public profile, and job postings get the verified badge with no admin in the loop.
6. The nightly sweep re-runs the verify for every FLC employer whose last check is older than 24 hours.

### FLC (fallback to manual)

If the DLSE check returns `not_found`, `expired`, `suspended`, `error`, or `captcha_blocked`, the snapshot records the result but **does not** flip `flcVerifiedAt`. The employer stays `pending` and surfaces in the admin pending queue with the auto-attempt details. The admin can then verify or reject manually; the existing `/admin/v1/employers/:id/{verify,reject,re-verify}` endpoints are unchanged. Admins can also force a fresh auto-check via `POST /admin/v1/employers/:id/recheck`.

We never auto-reject — false rejection is worse than longer time-to-verify.

### Grower

1. Employer signs up as Grower during onboarding.
2. Enters business name + EIN + county.
3. Status: `pending` until admin completes a spot-check.
4. Admin uses CA Secretary of State business entity search to confirm.
5. Once confirmed, admin marks `verified_at`. Employer notified.
6. Employer can publish jobs.

## Architecture

- **CA DIR/DLSE** — server-side HTTP scrape with `cheerio`. The Visualforce form is server-rendered HTML; we parse the dynamic `j_id` field-name prefix out of the form on every request rather than hardcoding it. reCAPTCHA v2 is loaded on the page but not currently enforced; if enforcement turns on we detect the marker and degrade to manual review.
- **DOL MSPA** — bulk dataset sync, not per-employer scrape. The federal WHD publishes the active-FLC list to `catalog.data.gov/dataset/registered-farm-labor-contractor-listing-5cd50`, refreshed monthly. We sync nightly into `mspa_flc_registry` and verification becomes a local SQL lookup. Absence in the latest sync = not registered.
- **Worker:** `services/flc-verifier` (single deployment, three pg-boss queues — `flc.verify` per-employer, `flc.sweep` nightly, `flc.mspa.sync` nightly).
- **Producer:** `POST /v1/employer/onboarding` and `PATCH /v1/employer/me` (when `flcLicenseNum` changes) enqueue `flc.verify`. The nightly sweep enqueues for any FLC employer whose `flcLastCheckedAt` is null or older than 24h.

## Scope

In scope:

- Employer signup with license/grower fields
- Auto-verify against CA DIR/DLSE on signup + nightly
- Auto-verify against DOL MSPA via local cache of the data.gov dataset
- Snapshot fields on `employer_profiles` (`flcLastCheckedAt`, `flcCheckStatus`, `flcExpiresAt`, `mspaVerifiedAt`, MSPA auth flags)
- Audit trail in `verification_log` for every auto-attempt outcome
- Admin pending list shows last-attempt status and reason
- Admin `/recheck` endpoint to retry an auto-verify on demand
- Manual admin verify/reject/re-verify as fail-soft fallback
- Verified badge display on employer profile + job cards
- Email notifications on verification / rejection

Out of scope (post-launch):

- Playwright + 2Captcha escalation when DLSE enforces reCAPTCHA (will degrade to manual review if it ever turns on)
- Admin UI for the pending queue (endpoints work; UI is a follow-up)
- Federal DOL MSPA cross-check via the legacy v1 API (bulk dataset is the source of truth at MVP)
- Self-attestation upgrades to full verification
- Vouching by other employers

## Success criteria

- Every FLC employer is auto-checked against DLSE + MSPA on signup.
- Verified-FLC employers are re-verified nightly with no admin action.
- Zero unverified employers can publish active jobs.
- Verified badge visible on every active employer's profile and job listings.
- Auto-verify failures (CAPTCHA, DLSE outage) surface in the admin pending list within minutes; manual verify still works.

## Dependencies

- [00-foundation/02-auth](../../00-foundation/02-auth/) — employer signup
- [00-foundation/06-email-pipeline](../../00-foundation/06-email-pipeline/) — email notifications
- [05-subscription-billing](../05-subscription-billing/) — billing follows verification
- [02-job-postings](../02-job-postings/) — gated by verification
