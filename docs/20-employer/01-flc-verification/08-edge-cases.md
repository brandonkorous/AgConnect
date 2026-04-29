# 01 — FLC Verification: Edge Cases & Risks

## DLSE database changes format

DLSE form structure changes; the future scraper breaks.

**Mitigation (Phase 2 scraper):**

- Daily scraper smoke test against a known-good license number; alert on parse failure.
- Manual fallback always available — admin can verify via the live form.

## License numbers reused / similar

Bad-actor registers with another business's license number.

**Mitigation:**

- Admin's job to compare business name against DLSE record; if mismatch, reject.
- Phase 2 scraper can detect duplicate license-num across employers (alert).
- Verification log preserves admin reasoning.

## Re-verification cadence

Licenses expire annually. We need to catch expirations.

**Mitigation:**

- Phase 2: nightly scraper re-checks all `flcVerifiedAt IS NOT NULL` employers.
- For MVP, admin runs a quarterly batch re-check manually.
- Per-employer "last re-verified" displayed in admin UI.

## Grower verification ambiguity

Small growers may not have a clear SOS entity (sole proprietor with DBA).

**Mitigation:**

- Admin uses judgment based on county agricultural commissioner records, business license, etc.
- Notes field captures their reasoning for the audit trail.
- For MVP, accept some ambiguity; tighten policy after observing fraud patterns.

## Employer publishes draft, then is rejected

Drafts existed before rejection. After rejection, they remain drafts (not published).

**Behavior:** correct. Drafts are private workspace; nothing public until verified + published.

## Verified employer's existing jobs at expiry

Employer's `flcVerifiedAt` is cleared (license expired). Active jobs shouldn't auto-close (would punish workers mid-application).

**Decision:** keep existing active jobs running until their `endDate`. Block new publishes only.

> **Inferred:** This is the employer-friendly default. If a grantee org wants stricter (auto-close all), we'd add a per-tenant flag. Out of scope for MVP.

## Multi-user employer org

Phase 2: an employer org has multiple users (owner + assistants). Verification is per-employer-profile, not per-user.

**Mitigation:** Clerk Organization → one `employer_profile`. Members of the Clerk org all see the same verification status.

## Wrong tenant

Employer signs up under wrong tenant (chose Salinas, should be Central Valley).

**Mitigation:**

- Admin can transfer via `/admin/v1/employers/:id/transfer-tenant` (creates new profile in target tenant, soft-deletes old).
- Out of scope for MVP — manual DB edit if it happens.

## Admin verifies wrong employer

Race condition: two admins simultaneously verify the same employer.

**Mitigation:**

- Endpoint is idempotent: second call returns 409 `already_verified` and doesn't override `verifiedBy`.
- Both admins see the result; verification log shows who got there first.

## Employer info change after publish

Employer changes business name post-verification. SEO slug doesn't update (immutable).

**Mitigation:**

- Business name update is allowed; sluggotcha noted.
- New jobs use the new name; old jobs keep their snapshot... wait, jobs link to employer by ID, so they show the current employer name. UPDATE: jobs always show current employer name. SEO slug for old URLs still works.

## Public profile of unverified employer

Should an unverified employer have any public presence?

**Decision:** No. RLS hides them. The `seo_slug` is reserved at create time but the page returns 404 until verified.

## Employer requests deletion

GDPR / CCPA: employer wants their data deleted.

**Mitigation:**

- Admin-mediated soft-delete of `employer_profiles`.
- Active jobs auto-close.
- Workers' application history preserved (with anonymized employer ref) for grant reporting.
- Hard-delete after data-retention period.

## License number leakage

`flc_license_num` is mildly sensitive. Should it be hashed or encrypted?

**Decision:** plaintext, RLS-protected. Admin needs to read it to verify; hashing prevents that. Encryption adds complexity without much gain when access is RLS-controlled. Encrypted at rest via Azure Postgres TDE.

## Open questions

1. DOL MSPA verification — does any partner org require it before launch? If so, add as a hard requirement.
2. Vouching by other employers (Phase 2) — how does it integrate with admin verification? Probably as a "1 of 3 vouches → fast-track admin review" model.
3. Re-verification cadence — annual, biannual? DLSE licenses are annual; we should match.
4. Grower verification automation — county agricultural commissioner records aren't centralized. Likely stays manual.
