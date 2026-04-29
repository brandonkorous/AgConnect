# 05 — Training Browser: Overview

## Purpose

Let workers browse F3- and CDFA-funded training programs, enroll in them, and receive reminders before sessions. Completion triggers automatic certificate generation (see [08-certificate-generation](../../00-foundation/08-certificate-generation/)) and updates the worker's Skills Wallet.

## Worker journey

1. Open `/training` → see active programs filtered by county and topic.
2. Tap a program → view details: title, description, dates, location, funder, capacity.
3. Tap "Enroll" → confirm enrollment.
4. Receive enrollment SMS + optional email.
5. Receive reminder SMS at 48h and 2h before each session.
6. Mark complete on the day (training org marks; worker doesn't self-mark).
7. Receive cert SMS + email with PDF.

## Scope (worker side)

In scope:

- Browse public training programs (`/training`)
- Filter by county, funder, topic, dates
- Enroll / unenroll
- Track enrolled programs (similar to applications)
- SMS reminders (48h, 2h)
- Cert delivery on completion
- Public, indexable program detail pages

Out of scope (worker side):

- Self-mark complete (training org marks)
- Wait-listing for full programs (Phase 2 — capacity management)
- Multi-session attendance tracking (assume single-session or all-or-nothing for MVP)
- Online / async training (in-person only for MVP; F3/CDFA programs are typically in-person)

## Roles

- **Worker:** browse, enroll, unenroll, view enrollment status.
- **Training org:** create programs, mark enrollment statuses (covered in their own admin views).
- **Admin:** all the above + grant reporting.

## Success criteria

- ≥ 30% of authenticated workers view at least one training program within 30 days of onboarding.
- ≥ 60% of enrolled workers attend (no-show rate < 40%).
- Reminder SMS arrives 48h and 2h before each session ≥ 99% of the time.
- Cert generated within 60 seconds of training-org marking complete.
- Programs indexed in Google with valid `EducationalOccupationalProgram` JSON-LD.

## Dependencies

- Training-org-side program creation (out of scope — describe interface)
- [00-foundation/05-sms-pipeline](../../00-foundation/05-sms-pipeline/) — reminders + cert SMS
- [00-foundation/08-certificate-generation](../../00-foundation/08-certificate-generation/) — on completion
- [10-worker/06-skills-wallet](../06-skills-wallet/) — display earned cert
- [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/) — indexable program pages

## Training-org-side feature note

This doc focuses on the worker side. Training-org features (create program, mark enrollments) are minimal for MVP — admin-mediated for many tenants, or via a simple training-org dashboard. Specifically:

- Program CRUD by training-org user (similar shape to job-postings CRUD)
- Enrollment status updates by training-org user (mark `completed`, `dropped`, `enrolled`)

These are detailed inline in this doc rather than a separate folder, since training-org is a small role in MVP.
