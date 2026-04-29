# 05 — Training Browser: Acceptance Criteria

## Functional (worker side)

- [ ] Worker can browse `/training` without sign-in.
- [ ] Filters (county, funder, topics, dates, hasCapacity) combine correctly.
- [ ] Worker can enroll in an active program with capacity remaining.
- [ ] Capacity decrement is atomic — overbooking impossible under concurrent enroll requests.
- [ ] Program at capacity transitions to `full` and rejects further enrollments (`409 program_full`).
- [ ] Worker can unenroll while status is `enrolled`; capacity restored, program reverts to `active` if was `full`.
- [ ] On completion (org marks), cert is generated within 60s, worker receives SMS + email.
- [ ] 48h and 2h reminder SMS arrive on schedule, idempotent flags prevent duplicates.
- [ ] Reminders bypass quiet hours (training is time-critical).
- [ ] Program canceled by org → all enrolled workers receive cancellation SMS within 5 minutes.

## Functional (org side)

- [ ] Training-org user can create program (draft → active).
- [ ] Org can edit description and session times even after publish.
- [ ] Org can mark enrollment status (completed / dropped / no-show) individually or in bulk.
- [ ] Bulk-mark requires confirmation modal.
- [ ] Org cannot see workers from other orgs' programs.

## Non-functional

- [ ] Listing P95 < 200ms with 1000 active programs.
- [ ] Detail page LCP < 2.5s on mobile 4G.
- [ ] EducationalOccupationalProgram JSON-LD validates.
- [ ] No double-cert generation (idempotency on `cert-{enrollmentId}` job key).

## Test scenarios

### Unit

1. Atomic capacity update SQL: 30 concurrent enrolls into a 20-capacity program produce exactly 20 successful enrollments.
2. State machine: program transitions `draft → active → full → active` allowed; `full → draft` not allowed.
3. Reminder dispatcher: enrollment 47h ahead does not yet trigger; 48h ahead triggers; flag flips so a re-run doesn't re-trigger.

### Integration

1. **Enroll happy path:** enroll → `enrollments` row, `enrolled_count` incremented, SMS + email enqueued.
2. **Capacity boundary:** 19/20 enrolled → 20th enrollment succeeds, status flips to `full`. 21st returns 409.
3. **Unenroll:** unenroll from full program → counter decremented, status back to `active`.
4. **Completion → cert:** org marks completed → `generate-certificate` job fires → `cert_url` set within 60s.
5. **Cross-org isolation:** Org A cannot read Org B's enrollments via roster endpoint.

### E2E (Playwright)

1. Worker browses `/training`, filters by Fresno + CDFA, enrolls in a program → `/me/training` shows the enrollment.
2. Org user logs in, marks 5 workers complete → all 5 see "Completed" + cert download in their dashboard within 60 seconds.
3. Worker enrolls, then unenrolls before start → capacity restored.

## Definition of done

- All capacity-management tests pass under concurrent load.
- Reminder dispatcher cron deployed; verified by injecting test enrollments at 47h59m, 48h01m, 48h05m and confirming exactly one fires.
- Cert generation tested end-to-end (see [08-certificate-generation](../../00-foundation/08-certificate-generation/) acceptance).
- Org dashboard tested with at least 50-worker roster for performance.
- Admin runbook: how to manually re-fire a missed reminder, how to cancel a program with active enrollments.
