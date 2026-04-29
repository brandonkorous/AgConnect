# 01 — FLC Verification: Overview

## Purpose

Verify that employers posting jobs are legitimate. For Farm Labor Contractors (FLCs), this means confirming a current California DIR/DLSE license. For growers, it means a lighter-weight business attestation. Per kickoff §9.

Worker trust depends on this. Grant reports require demonstrated employer vetting.

## Two employer categories

- **Growers** — direct farm operators. No state license required to hire workers. Verify via business name + EIN + county agricultural commissioner lookup, or SOS business entity search.
- **Farm Labor Contractors (FLC)** — anyone who, for a fee, recruits/hires/transports workers for third-party growers. Requires CA DIR/DLSE FLC license + federal DOL MSPA registration.

## Verification flow

### FLC

1. Employer signs up as FLC during onboarding.
2. Enters license number + business name.
3. Status: `pending`. Cannot publish jobs yet.
4. Admin (or scraper, Phase 2) verifies against [permits.dir.ca.gov](https://permits.dir.ca.gov).
5. Admin marks `flc_verified_at`. Employer notified by email.
6. Employer can now publish jobs. "Verified" badge appears on profile.

### Grower

1. Employer signs up as Grower during onboarding.
2. Enters business name + EIN + county.
3. Status: `pending` until admin completes a spot-check.
4. Admin uses CA Secretary of State business entity search to confirm.
5. Once confirmed, admin marks `verified_at`. Employer notified.
6. Employer can publish jobs.

## Phased automation

- **MVP:** manual admin verification within 1 business day.
- **Phase 2:** Playwright/Puppeteer scraper that submits to the DLSE form, parses the response, and auto-marks `flc_verified_at`. Re-runs nightly to catch expired licenses.

## Scope

In scope:

- Employer signup with license/grower fields
- "Pending" gate that prevents job publishing
- Admin verification UI (in admin app)
- Verified badge display on employer profile + job cards
- Rejection flow with reason
- Email notifications on verification / rejection

Out of scope (MVP):

- Automated DLSE scraper
- Federal DOL MSPA cross-check
- Self-attestation upgrades to full verification
- Vouching by other employers

## Success criteria

- 100% of FLC employers verified before any job is published under their account.
- Verification turnaround ≤ 1 business day.
- Zero unverified employers can publish active jobs.
- Verified badge visible on every active employer's profile and job listings.

## Dependencies

- [00-foundation/02-auth](../../00-foundation/02-auth/) — employer signup
- [00-foundation/06-email-pipeline](../../00-foundation/06-email-pipeline/) — email notifications
- [05-subscription-billing](../05-subscription-billing/) — billing follows verification
- [02-job-postings](../02-job-postings/) — gated by verification
