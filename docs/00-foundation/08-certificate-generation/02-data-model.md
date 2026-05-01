# 08 — Certificate Generation: Data Model

## enrollments.cert_url

Defined in [10-worker/05-training-browser/02-data-model.md](../../10-worker/05-training-browser/02-data-model.md). Path:

```
certificates/{tenantId}/{enrollmentId}.pdf
```

Plus:

```prisma
// extension fields on Enrollment
certUrl              String?   @map("cert_url")           // Supabase Storage path
certGeneratedAt      DateTime? @map("cert_generated_at")
certificateId        String?   @unique @map("certificate_id")    // human-readable cert ID for verification
```

`certificateId` format: `AC-{YYYY}-{6-char-hash}` (e.g., `AC-2026-X7K2P9`). Stored on the enrollment for re-render consistency and as a verification hash.

## Cert generation job

Same `pg-boss` table as other queues. Job name: `generate-certificate`. Payload: `{ enrollmentId }`. Idempotency key: `cert-{enrollmentId}` so duplicate triggers (e.g., admin manually re-completing) don't generate twice.

## Org-side signing data

Training orgs store their signature data in `employer_profiles` (training orgs share the table with employers, distinguished by `users.role`):

```prisma
// extension on EmployerProfile (used for training orgs too)
signatureName     String?  @map("signature_name")    // "Maria Lopez, Director of Workforce"
signatureTitle    String?  @map("signature_title")
signatureImageUrl String?  @map("signature_image_url")  // optional rendered signature image
```

If `signatureImageUrl` is null, the cert renders typed name + title. If set, it embeds the rendered signature.

## RLS

`enrollments` standard tenant isolation. Self-read for the worker, plus the org and admin:

```sql
CREATE POLICY enrollments_self ON enrollments
  FOR SELECT
  USING (
    worker_id = current_setting('app.user_id', true)::uuid
    OR EXISTS (
      SELECT 1 FROM training_programs tp
      WHERE tp.id = enrollments.program_id
      AND tp.org_id = current_setting('app.user_id', true)::uuid
    )
    OR current_setting('app.role', true) = 'admin'
  );
```

Cert downloads use signed Supabase Storage URLs scoped per access; the URL is the auth boundary (24h expiry).

## Indexes

- `enrollments(certificate_id)` unique — for verification lookups (post-MVP).
- `enrollments(certGeneratedAt)` partial index for monitoring: `WHERE cert_url IS NOT NULL AND cert_generated_at > now() - interval '30 days'`.

## Cert storage layout

```
certificates/
  {tenantId}/
    {enrollmentId}.pdf       # canonical
    {enrollmentId}-thumb.png # 256x optional thumbnail for UI (skip for MVP)
```

Lifecycle: certificates retained indefinitely. Worker can request anonymization which strips name from cert metadata but preserves the PDF for the org's grant reporting (needs counsel review).
