# 08 — Certificate Generation: Edge Cases & Risks

## Worker name typo on cert

Worker reports their name is misspelled on a printed cert.

**Mitigation:**

- The cert renders from `worker_profiles.first_name` / `last_name`. Worker corrects in profile editor → admin triggers `POST /admin/v1/enrollments/:id/regenerate-cert` → new PDF uploaded with the same cert ID.
- Old PDF is overwritten in Blob (no versioning for MVP).

> **Inferred:** Cert ID is preserved across regeneration so verification (post-MVP) doesn't break. Treat the cert ID as the durable identifier; the PDF content is mutable until grants final-report.

## Org changes signature mid-cohort

Training org updates their `signatureName` after some certs are generated.

**Behavior:** existing certs keep the old signature in their PDFs. Newly generated certs use the new one. Admin can bulk-regenerate via a script (`pnpm --filter pdf regenerate --tenantId=X --orgId=Y --since=2026-01-01`).

## Long names / overflow

Worker name with 50+ characters or program title spanning 3 lines breaks the layout.

**Mitigation:**

- React-PDF's flexbox handles wrapping; we test long-name fixtures.
- Worker name: max 80 chars at render (truncate with ellipsis if longer; rare edge case).
- Program title: limit to 100 chars at create time (`titleEn.length <= 100`).

## Bilingual program title — only one language

If `programTitleEs` is missing (CHECK constraint should prevent this; but defensive):

**Behavior:** render only `titleEn` and add a Sentry warning. Don't fail the cert generation.

## Tenant logo missing or invalid URL

`tenants.settings.branding.logoUrl` is null, or the URL 404s at render time.

**Mitigation:**

- React-PDF retries image load; on failure, we catch and substitute the default AgConn logo.
- Logo URLs validated at admin save time (HEAD request returns 200 + image content-type).
- Fallback default committed to repo.

## Storage cost

Hundreds of thousands of certs in Azure Blob aren't free.

**Estimates:** at 500 KB / cert × 10,000 certs / month, that's 5 GB / month, ~$0.10 / month at Hot tier. Trivial.

If volume grows: move to Cool tier after 90 days, archive after 1 year. Out of scope for MVP.

## Cert tampering

A worker downloads a cert, edits it in Photoshop, presents the fake to an employer.

**Mitigation (Phase 2+):**

- Public verification endpoint: `agconn.com/verify/AC-2026-X7K2P9` returns canonical metadata (worker name, program, date, org) so an employer can compare.
- The cert PDF includes the verification URL prominently in the footer.
- For MVP, the verification URL points to a "Coming soon" page or is omitted.

> **Inferred:** Public verification is a Phase 2 feature. For MVP, the cert is "trust on first use" — most employer interactions happen within AgConn, where the cert is verified by definition.

## React-PDF version drift

`@react-pdf/renderer` releases sometimes change layout behavior subtly.

**Mitigation:**

- Pin exact version in `package.json` (no caret).
- Visual snapshot test in CI catches regressions.
- Manual visual review on every minor version bump.

## Font licensing

Inter is OFL-licensed (free for embedding). Other Google Fonts vary. We've checked Inter; if we add another font, re-check the license.

## PDF accessibility

PDFs can be accessibility-friendly via tagged PDF / structure tree. React-PDF's tagged-PDF support is limited.

**Mitigation:**

- For MVP, PDFs are visually accessible (good contrast, readable font size, no images-of-text without alt).
- Tagged PDF support is a Phase 3+ enhancement when a partner requires Section 508 compliance.

## Email deliverability with attachment

PDF attachments increase email size and can trigger spam filters.

**Mitigation:**

- PDF size kept under 500 KB.
- Email body has the link to download (short Blob signed URL) AS WELL AS the attachment, so workers without attachment access still get the cert.

## SMS quiet hours

If a cert generates at 11 PM PT, the SMS link is held until 7 AM PT (per [05-sms-pipeline](../05-sms-pipeline/)). The email is sent immediately.

**Behavior is correct.** No special-case for cert SMS.

## Worker has no email and no phone

Edge case — onboarding requires phone, email is optional. Cert delivery via SMS works.

If somehow the worker has no contact method: the cert is generated, the `cert_url` is set, but no notification is sent. The worker can find it in their Skills Wallet on next login.

## Open questions

1. Public verification URL (Phase 2) — what data does it expose? Worker first name only? Last initial? Full name? Privacy/utility tradeoff to discuss.
2. Multiple certs from one program (e.g., a worker repeats a course) — do we generate two with different IDs or one updated? Recommendation: one cert per `enrollmentId`; new enrollment → new cert.
3. Localized funder names — should "CDFA" stay as "CDFA" in ES or expand to "Departamento de Alimentación y Agricultura de California"? Defer to grantee preference.
