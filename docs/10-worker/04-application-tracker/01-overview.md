# 04 — Application Tracker: Overview

## Purpose

When a worker applies to a job, they need to (a) actually apply, (b) see the status, and (c) get notified at every change. The employer side of this — reviewing and acting on applications — lives in [20-employer/03-applicant-review](../../20-employer/03-applicant-review/).

## Worker journey

1. Tap "Apply" on a job detail page.
2. Confirm the application details (auto-filled from profile).
3. Receive immediate confirmation SMS.
4. Track status in the dashboard.
5. Receive SMS at every status change (reviewed, hired, rejected).
6. If hired: confirmation SMS + email with next steps.

## Goals

- Apply with one tap once profile is complete.
- Real-time status visibility.
- Bilingual notifications at every step.
- No duplicate applications to the same job.
- Capture wage at hire (grant-reporting requirement).

## Scope (worker side)

In scope:

- Apply confirmation flow
- Application list (`/applications`) with filters (active / hired / closed)
- Application detail with status timeline
- SMS + email notifications on every status change
- Withdraw an application (worker-initiated)

Out of scope (worker side):

- Cover letter / custom message — Phase 2 (workers may want to add a brief note; design later)
- Application without complete profile — blocked, prompt to complete profile first
- Re-apply to the same job after rejection — Phase 2 (currently one application per (worker, job))

## Roles

- **Worker:** see and manage their own applications.
- **Employer:** review and act on their own job's applications (separate feature).
- **Admin:** view all applications for grant reporting.

## Success criteria

- ≥ 70% of authenticated workers who view a job apply to at least one within 14 days.
- Application status changes propagate to worker via SMS within 5 minutes (excluding quiet hours).
- Zero duplicate applications to the same `(worker, job)` pair.
- Wage at hire captured in 100% of `hired` applications (grant requirement).

## Dependencies

- [03-job-discovery](../03-job-discovery/) — entry point
- [02-resume-editor](../02-resume-editor/) — profile data
- [00-foundation/05-sms-pipeline](../../00-foundation/05-sms-pipeline/) — notifications
- [00-foundation/06-email-pipeline](../../00-foundation/06-email-pipeline/) — hire email
- [20-employer/03-applicant-review](../../20-employer/03-applicant-review/) — sister feature on employer side
