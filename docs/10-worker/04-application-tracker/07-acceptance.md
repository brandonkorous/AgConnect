# 04 — Application Tracker: Acceptance Criteria

## Functional

- [ ] Worker can apply to an active job in their tenant with one tap.
- [ ] Duplicate apply (same `worker_id` + `job_id`) returns `409 already_applied`.
- [x] ~~Apply fails (`403 not_onboarded`) for workers without `onboardedAt`.~~ **Reversed 2026-05-14:** workers may apply with whatever profile data they've already shared — see [`services/api/src/applications/routes.ts` apply handler](../../../services/api/src/applications/routes.ts). The audience is farmworkers who often arrive via SMS OTP with only a verified phone; the dignified default is to let them express interest immediately. Missing-field nudges live on the employer's applicant card, not on apply.
- [ ] Apply fails (`422 job_not_active`) for jobs in `draft`, `closed`, `filled`, or deleted.
- [ ] Worker sees their applications in `/applications` filtered by tab (active / hired / closed).
- [ ] Application detail shows full event timeline ordered by `createdAt`.
- [ ] Worker can withdraw an application in `applied` or `reviewed` status; cannot withdraw after hire/reject.
- [ ] Withdrawing an application enqueues an email to the employer.
- [ ] Apply triggers immediate SMS to worker AND email to employer.
- [ ] Status change to `reviewed` / `hired` / `rejected` triggers worker SMS in their preferred language.
- [ ] `hired` triggers SMS + email; other statuses SMS only.
- [ ] `wageOffered` and `startDate` captured on hire (NOT NULL on `hired` rows).
- [ ] `countyAtApply` and `skillsAtApply` snapshots set on apply, never updated.

## Non-functional

- [ ] Apply latency P95 < 500ms (excluding SMS/email enqueue, which is async).
- [ ] Application list query P95 < 200ms with 1000 applications per worker.
- [ ] Notifications dispatched within 5 minutes of status change (excluding quiet hours).

## Test scenarios

### Unit

1. Apply API rejects un-onboarded workers.
2. Withdraw API rejects status `hired` / `rejected` / `withdrawn`.
3. State machine: only valid transitions allowed; invalid transitions return 422.

### Integration

1. **Apply happy path:** apply → `applications` row exists, `application_events` row exists, SMS enqueued (verified in `sms_log`), email enqueued (verified in `email_log`).
2. **Duplicate apply:** apply twice → second returns 409, only one row in DB.
3. **Withdraw:** apply, withdraw → status updated, employer email enqueued.
4. **Cross-tenant:** worker A in Tenant 1 cannot apply to job in Tenant 2 (RLS hides job; returns 404).
5. **Hired wage capture:** employer transitions to hired without `wageOffered` → 422 with field-level error.

### E2E (Playwright)

1. Worker applies, immediately receives SMS (mock Twilio in test).
2. Employer marks reviewed → worker SMS arrives in preferred language.
3. Employer hires with wage → worker SMS + email + start date displayed in detail.

## Definition of done

- All state-machine transitions covered by tests.
- SMS + email idempotency keys verified (no duplicate sends from double-firing webhooks).
- Sentry tags every status transition with `from_status`, `to_status`, `actor_role`.
- Admin runbook: how to correct a status mistake silently (using `metadata.silent`).
