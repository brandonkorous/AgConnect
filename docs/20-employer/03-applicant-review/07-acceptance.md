# 03 — Applicant Review: Acceptance Criteria

## Functional

- [ ] Employer sees only their own applications (RLS enforced + tested cross-tenant + cross-employer).
- [ ] Inbox shows new applications across all postings, newest first, with unread indicator.
- [ ] Kanban view groups applications by status with accurate counts.
- [ ] Applicant detail shows full worker profile (name, contact, skills, experience, certs, availability).
- [ ] Worker phone is visible to employer only when an application exists between them.
- [ ] Hire flow requires `wageOffered` and `startDate`; both validated.
- [ ] Hire wage must be ≥ posting's `wageMin` (UX validation; not enforced on backend if employer overrides — TBD).
- [ ] Reject flow optionally captures reason + free-text; both private to employer + admin.
- [ ] Bulk transition (mark reviewed / reject) supports up to 100 IDs in one call.
- [ ] State machine: invalid transitions return 422.
- [ ] Hire increments `job_postings.hireCount`; reaching `positionsTotal` auto-flips posting to `filled`.
- [ ] Worker SMS/email fired on every applicable transition (per [10-worker/04-application-tracker/06-messaging.md](../../10-worker/04-application-tracker/06-messaging.md)).

## Non-functional

- [ ] Inbox query P95 < 200ms with 1000 applications across 50 postings.
- [ ] Kanban load P95 < 250ms.
- [ ] Bulk transition of 100 IDs completes in < 5s.

## Privacy

- [ ] Employer cannot read another employer's applications (RLS).
- [ ] Worker cannot see `employerNote` or `rejectionReason` (API filter + tests).
- [ ] Applicant detail includes phone only after the application exists; pre-application search shows only first name + last initial.

## Test scenarios

### Unit

1. State machine: `applied → reviewed → hired` valid; `applied → hired` valid (skip review); `hired → applied` invalid (422).
2. Hire requires both `wageOffered` and `startDate`.
3. Bulk endpoint: 50 valid IDs → 50 succeeded; mix of valid + invalid IDs → partial success with `failed[]` populated.
4. Reject reasons: enum constraint enforced.

### Integration

1. **Cross-employer RLS:** Employer A logs in, GET /employer/applications/<B's appId> → 404.
2. **Hire triggers worker SMS + email:** verify `sms_log` and `email_log` rows after transition.
3. **Auto-fill posting:** post with `positionsTotal: 2`, hire 2 workers → posting status flips to `filled`.
4. **Bulk reject:** 50 applications in `applied` → bulk reject all → all in `rejected`, all workers receive SMS, no extra DB rows.
5. **Note privacy:** employer adds note → worker GET `/v1/applications/:id` does NOT contain the note.

### E2E (Playwright)

1. Employer drag-drops applicant from Applied to Reviewed → kanban updates → worker SMS fires.
2. Employer hires applicant → modal validates wage/date → confirm → applicant moves to Hired column → posting `hireCount` increments.
3. Bulk-select 5 applicants → bulk reject → kanban refresh shows 5 fewer cards.

## Definition of done

- All state transitions tested.
- Drag-and-drop tested on Chrome desktop, Safari iOS, Chrome Android.
- Keyboard-only kanban interaction works (a11y).
- Sentry tags every transition with `from_status`, `to_status`, `actor_user_id`.
- Admin runbook: how to revert an accidental hire (admin endpoint, sends `metadata.silent` event).
