# 03 — Applicant Review: Overview

## Purpose

Employers review applications, move them through a kanban pipeline (Applied → Reviewed → Hired), capture wage at hire (grant requirement), and reject candidates they're not pursuing. Worker-side of this lives in [10-worker/04-application-tracker](../../10-worker/04-application-tracker/).

## Employer journey

1. Employer dashboard shows new applications across all postings (kanban summary, read-only).
2. Per-posting kanban view at `/employer/jobs/:id/applicants`: Applied / Reviewed / Hired columns.
3. Tap an applicant → see profile (name, county, skills, certifications, experience).
4. Move card by drag (desktop) or via tap → action sheet (mobile).
5. To hire: enter wage + start date, confirm. Triggers worker SMS + email.
6. To reject: optional reason (private to admin), confirm. Triggers worker SMS.

## Scope

In scope:

- Cross-posting applicant inbox (list mode)
- Dashboard kanban summary (read-only, links into the per-posting kanban)
- Per-posting kanban (Applied / Reviewed / Hired columns; Rejected is hidden by default; drag-to-transition with hire/reject modals firing on drop)
- Applicant profile drawer
- Status transitions with required fields (wage on hire)
- Bulk actions: bulk-reject, bulk-mark-reviewed (inbox surface)
- Application activity timeline (for the employer)
- Notes (private to employer)

Future surfaces tracked separately in [09-future-considerations.md](09-future-considerations.md): a cross-job applicant pipeline page and a cross-site workforce/roster board.

Out of scope:

- Two-way messaging worker ↔ employer (Phase 2)
- Interview scheduling (Phase 3)
- Background check integration (out of scope)
- Score / rating workers (Phase 2 — careful UX needed)

## Roles

- **Employer:** review applicants for their own jobs.
- **Org members:** Phase 2 — multi-user employer org with shared access.
- **Admin:** read-only access for grant reporting.

## Success criteria

- Median time from new application to first review < 2 business days.
- Hire flow capture wage 100% of the time (grant-blocking).
- Bulk-reject reduces friction for popular postings (test: 50 applicants rejected in < 60 seconds).
- All status changes propagate to workers within 5 minutes.

## Dependencies

- [02-job-postings](../02-job-postings/) — produces the listings
- [10-worker/04-application-tracker](../../10-worker/04-application-tracker/) — sister worker view
- [00-foundation/05-sms-pipeline](../../00-foundation/05-sms-pipeline/) — worker notifications
- [00-foundation/06-email-pipeline](../../00-foundation/06-email-pipeline/) — hire email
- [04-worker-search](../04-worker-search/) — overlapping concept (employer searches workers proactively)
