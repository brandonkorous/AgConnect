# 08 — Certificate Generation: Overview

## Purpose

Generate bilingual PDF certificates for training program completion. Certificates are signed electronically by the training organization (UETA-compliant — no DocuSign for MVP, per kickoff §12).

## Architecture

```
enrollment.status → 'completed'
  ↓
pg-boss enqueue 'generate-certificate' { enrollmentId }
  ↓
worker loads enrollment + program + worker + org branding
  ↓
React-PDF component renders bilingual cert
  ↓
PDF uploaded to Supabase Storage: certificates/{tenantId}/{enrollmentId}.pdf
  ↓
enrollments.cert_url updated
  ↓
SMS + email delivery to worker
```

## Stack

- **`@react-pdf/renderer` 4.5.1** — declarative PDF rendering
- **Supabase Storage** — certificate storage
- **pg-boss** — async generation
- **Supabase Storage signed URLs** — short-lived links (24h) for cert download

## Legal basis

Certificates are institutional records (not court documents or contracts). California's UETA (Civil Code §1633.1) and federal ESIGN Act make e-signatures legally binding when parties agree to transact electronically. Training orgs and workers both accept terms on signup that include consent to electronic transactions.

> **Inferred:** No DocuSign or wet-signature integration in MVP. The training org's name, title, date, and a rendered signature graphic in the PDF constitute a UETA-compliant electronic signature. The PDF generation pipeline is modular — if a future grantee partner requires higher assurance, swap in DocuSign at the signing step without changing the rest.

## Scope

In scope:

- React-PDF component for the canonical certificate
- Per-tenant branding override (logo, colors)
- Bilingual rendering (two-column or stacked, depending on field)
- Storage in Supabase Storage with signed URL access
- pg-boss worker that generates on enrollment completion
- Re-generation endpoint (admin only) if data changes

Out of scope:

- DocuSign / Adobe Sign integration
- Custom certificate templates per training org (post-MVP — currently one template)
- QR-code verification (post-MVP — would require a public verification endpoint)

## Success criteria

- 100% of completed enrollments have a `cert_url` set within 60 seconds.
- Certificates render correctly with: tenant logo, training org name + signature, worker name, program name, completion date, certificate ID.
- Both EN and ES content is present and legible.
- Cert downloads work on mobile browsers without authentication friction.

## Dependencies

- [10-worker/05-training-browser](../../10-worker/05-training-browser/) — caller (on enrollment completion)
- [10-worker/06-skills-wallet](../../10-worker/06-skills-wallet/) — UI consumer
- [05-sms-pipeline](../05-sms-pipeline/) — delivery
- [06-email-pipeline](../06-email-pipeline/) — delivery
- Supabase Storage — storage
