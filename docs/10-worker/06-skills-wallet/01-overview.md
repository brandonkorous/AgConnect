# 06 — Skills Wallet: Overview

## Purpose

A worker-owned collection of all certifications they've earned through AgConn. Certificates from completed training programs appear automatically; manually-added certs from the resume editor also appear. Workers can view, download (PDF), and share each cert.

## Worker journey

1. Open `/wallet` → see all earned certs.
2. Tap a cert → preview, download PDF, share link.
3. Share via WhatsApp, SMS, copy link, or attach to a job application (Phase 2 — currently certs visible to employers via profile).

## Scope

In scope:

- List all certs (from completed enrollments + manually added)
- Download cert PDF
- Share via system share sheet / WhatsApp / SMS / copy link
- Public verification page (`/verify/:certId`) — Phase 2 (URL exists, MVP returns "Coming soon")
- Filter / search wallet (post-MVP)

Out of scope:

- Adding certs without an enrollment (Phase 2 — manual upload of external certs)
- Multi-language cert variants beyond the bilingual single PDF
- Cert revocation by issuer (Phase 2 — orgs may need to revoke)
- Skill assessments / digital badges beyond cert PDFs

## Roles

- **Worker:** view + download own wallet.
- **Employer:** see worker's certifications when reviewing an application.
- **Admin:** view all certs across tenant; mark suspicious for review.

## Success criteria

- 100% of completed enrollments appear in the worker's wallet within 60 seconds of `cert_url` being set.
- Worker can download a cert PDF in < 2 taps from `/wallet`.
- Share-link copy puts a publicly-shareable signed URL on the clipboard (Phase 2 — for MVP, just the platform URL).

## Dependencies

- [00-foundation/08-certificate-generation](../../00-foundation/08-certificate-generation/) — produces the PDFs
- [05-training-browser](../05-training-browser/) — sister feature; enrollments source
- [02-resume-editor](../02-resume-editor/) — manual certs from `worker_profiles.certifications`
