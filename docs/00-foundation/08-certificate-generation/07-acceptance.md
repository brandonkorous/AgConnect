# 08 — Certificate Generation: Acceptance Criteria

## Functional

- [ ] On enrollment status change to `completed`, certificate generates within 60 seconds.
- [ ] Generated PDF is < 500 KB.
- [ ] Certificate includes: tenant logo, worker first+last name, program title (EN+ES), completion date (EN+ES formatted), org signature block, certificate ID.
- [ ] Worker receives SMS link + email with PDF attachment in their preferred language.
- [ ] Cert download endpoint returns 302 redirect to a 24h-signed Azure Blob URL.
- [ ] Admin can regenerate a certificate; the same `certificateId` is reused and the blob is overwritten.
- [ ] Generation is idempotent — re-running with the same `enrollmentId` produces no duplicate Blob, no duplicate cert ID.

## Non-functional

- [ ] PDF render time < 2 seconds per cert (excluding upload).
- [ ] Concurrent generation: 50 enrollments completing simultaneously all complete within 5 minutes.
- [ ] PDF renders identically across PDF viewers (Adobe Reader, macOS Preview, Chrome built-in viewer, mobile Gmail preview).

## Quality

- [ ] All Spanish accent characters render correctly (`á`, `é`, `í`, `ñ`, `ó`, `ú`, `¡`, `¿`).
- [ ] Worker names in non-Latin scripts (rare but possible) render correctly OR fall back gracefully (Inter has Latin coverage; for non-Latin, render using the closest available glyph; document this limitation).
- [ ] Long worker names (40+ chars) and long program names don't break the layout.
- [ ] Tenant with no logo URL falls back to the AgConn default logo.
- [ ] Org with no signature image renders typed name + title.

## Test scenarios

### Unit

1. `generateCertId()` produces unique IDs in expected format `AC-{YYYY}-{6-char-hash}`.
2. `fmtDateEn` and `fmtDateEs` format dates correctly across DST boundaries.
3. `renderCertificatePdf` produces a non-empty Buffer for valid input.

### Integration

1. **Full path:** create completed enrollment → assert `cert_url` set, blob exists, SMS+email enqueued.
2. **Idempotency:** trigger generation twice for the same enrollment → only one cert ID, one upload.
3. **Re-generation:** admin POST `/admin/v1/enrollments/:id/regenerate-cert` → blob overwritten, `cert_generated_at` updated, `certificate_id` unchanged.
4. **Signed URL:** GET `/v1/enrollments/:id/certificate` → 302 to a Blob URL that returns the PDF for 24h.

### Manual / visual

1. Render certificates for: short name, long name, name with accents, name with hyphen.
2. Open generated PDF in Adobe, Preview, Chrome, mobile Gmail preview — confirm identical rendering.
3. Print to paper (some workers print certs); confirm legibility.

## Definition of done

- Snapshot test fixture committed (`packages/pdf/test/fixtures/cert-sample.pdf`).
- Visual regression check in CI: render a sample cert and pixel-diff against fixture.
- Azure Blob container `certificates` configured with private access; signed URLs enforced.
- Default tenant logo + AgConn default logo committed to `packages/pdf/src/assets/`.
- Admin runbook: how to manually regenerate a certificate, how to fix a typo (update DB → trigger regenerate).
