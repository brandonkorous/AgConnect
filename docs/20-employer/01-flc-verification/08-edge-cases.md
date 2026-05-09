# 01 — FLC Verification: Edge Cases & Risks

## DLSE form structure changes

Salesforce rotates the dynamic `j_id<N>:` prefix on the Visualforce form, or moves the result table.

**Mitigation:**

- The DLSE scraper parses the `j_id` prefix on every request rather than hardcoding it; suffix-matched field-name lookup survives most redeploys.
- `auto_verify_failed` rows with `kind: 'error'` and `message: 'form_field_names_missing'` or `unknown_status:*` are the canary — alert when these spike.
- Manual fallback always available — admin can verify via the live form and call `POST /admin/v1/employers/:id/verify`.

## DLSE turns on reCAPTCHA enforcement

The reCAPTCHA v2 widget is loaded on the search page today but not gating the submit. If DLSE flips enforcement on, every scrape returns the challenge HTML.

**Mitigation:**

- The scraper returns `kind: 'captcha_blocked'` when it sees the marker. The handler writes `flcCheckStatus = captcha_blocked` and an `auto_verify_failed` audit row — it does NOT auto-reject.
- The employer stays in the admin pending queue with the CAPTCHA reason visible.
- `flcVerifiedAt` for previously-verified employers is unaffected — they keep their badge.
- Follow-up: build a Playwright + 2Captcha escalation behind a feature flag if enforcement persists.

## DLSE site is down

Network timeout, 5xx response, DNS failure during a verify attempt.

**Mitigation:**

- pg-boss retries the job 3× with exponential backoff (60s base) within the 23h expiration window.
- After exhaustion, the snapshot records `flcCheckStatus = error` with the failure message; the nightly sweep re-enqueues the next day.
- Already-verified employers keep their badge — we don't strip on transient failure.

## License numbers reused / similar

Bad-actor registers with another business's license number.

**Mitigation:**

- DLSE returns the legal name on record; the auto-verify writes it to `flcLegalNameOnRecord`. The admin pending list highlights mismatches between submitted `legalName` and `flcLegalNameOnRecord`.
- A future job can flag duplicate `flcLicenseNum` across employers.
- Verification log preserves the DLSE legal name in the audit payload.

## MSPA dataset stale or missing

The data.gov dataset is updated monthly upstream. A registered FLC could be absent from the cache for up to 30 days after their first registration.

**Mitigation:**

- `mspaVerifiedAt = null` does NOT block the FLC verified badge — the DLSE check is the primary signal.
- The MSPA snapshot is shown on the public profile when present (with the housing/transport/driving auth flags) but not absent-shamed.
- `mspa_sync_run.status = failed` triggers a Sentry alert; the prior dataset stays in place rather than being nuked.
- The bulk sync refuses to ingest a parsed file with zero rows (parser regression guard).

## Re-verification cadence

Licenses expire annually. We need to catch expirations.

**Mitigation:**

- The nightly sweep re-checks every FLC employer whose `flcLastCheckedAt` is older than 24h.
- DLSE's "Expired" status maps to `flcCheckStatus = expired`. Per-employer "last re-verified" displays in the admin queue and on the employer's own dashboard.
- An expired re-check does not strip `flcVerifiedAt` automatically (see "expiry" item below) — the admin makes that call.

## Grower verification ambiguity

Small growers may not have a clear SOS entity (sole proprietor with DBA).

**Mitigation:**

- Grower profiles are not auto-verified — they always go through admin spot-check.
- The flc-verifier worker writes `flcCheckStatus = not_applicable` on grower rows so the sweep doesn't keep retrying.
- Notes field captures the admin's reasoning for the audit trail.

## Employer publishes draft, then is rejected

Drafts existed before rejection. After rejection, they remain drafts (not published).

**Behavior:** correct. Drafts are private workspace; nothing public until verified + published.

## Verified employer's existing jobs at expiry

Employer's `flcVerifiedAt` is cleared (license expired). Active jobs shouldn't auto-close (would punish workers mid-application).

**Decision:** keep existing active jobs running until their `endDate`. Block new publishes only.

> **Inferred:** This is the employer-friendly default. If a grantee org wants stricter (auto-close all), we'd add a per-tenant flag. Out of scope for MVP.

## Multi-user employer org

An employer org has multiple users (owner + assistants). Verification is per-employer-profile, not per-user.

**Mitigation:** Clerk Organization → one `employer_profile`. Members of the Clerk org all see the same verification status.

## Wrong tenant

Employer signs up under wrong tenant.

**Mitigation:**

- Admin can transfer via `/admin/v1/employers/:id/transfer-tenant` (creates new profile in target tenant, soft-deletes old).
- Out of scope for MVP — manual DB edit if it happens.

## Admin verifies wrong employer

Race condition: two admins simultaneously verify the same employer.

**Mitigation:**

- Endpoint is idempotent: second call returns 409 `already_verified` and doesn't override `verifiedBy`.
- Both admins see the result; verification log shows who got there first.

## Employer info change after publish

Employer changes business name post-verification. SEO slug doesn't update (immutable). Jobs always show current employer name; SEO slug for old URLs still works.

## Public profile of unverified employer

**Decision:** No. RLS hides them. The `seo_slug` is reserved at create time but the page returns 404 until verified.

## Employer requests deletion

**Mitigation:**

- Admin-mediated soft-delete of `employer_profiles`.
- Active jobs auto-close.
- Workers' application history preserved (with anonymized employer ref) for grant reporting.
- Hard-delete after data-retention period.

## License number leakage

`flc_license_num` is mildly sensitive. Decision: plaintext, RLS-protected. Admin needs to read it to verify. Encrypted at rest via Postgres TDE.

## Open questions

1. **MSPA gating:** should `mspaVerifiedAt = null` block the verified badge? Currently no — DLSE is primary, MSPA is supplementary. Revisit if a partner org requires both.
2. **Vouching by other employers (post-launch):** how does it integrate with verification? Probably as a "3 vouches → fast-track admin review" model.
3. **Re-verification cadence:** 24h works for MVP scale. As employer count grows, consider weekly + on-publish re-checks instead of nightly across the whole table.
4. **Grower verification automation:** county agricultural commissioner records aren't centralized. Likely stays manual.
