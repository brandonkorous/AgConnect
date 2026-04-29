# 01 — FLC Verification: Acceptance Criteria

## Functional

- [ ] Employer onboarding form requires `licenseType` and the appropriate downstream fields (license # for FLC, EIN + county for grower).
- [ ] On submit, `employer_profiles` row created with `flcVerifiedAt = null`.
- [ ] Pending employers cannot publish job postings (`403 employer_not_verified`).
- [ ] Pending employers CAN create draft job postings.
- [ ] Admin verify endpoint flips `flcVerifiedAt` and clears any rejection state.
- [ ] Admin reject endpoint sets `rejectedAt` + `rejectionReason`; employer email sent within 5 minutes.
- [ ] Verified badge visible on employer profile pages and job cards.
- [ ] Soft-deleted or rejected employers' jobs return 404 / 410 to public crawlers.
- [ ] Updating license # resets `flcVerifiedAt`; admin re-verification required.

## Non-functional

- [ ] Verification turnaround target: median ≤ 1 business day; track via `verification_log` timestamps.
- [ ] Admin verification list query P95 < 200ms with 100 pending.

## Compliance

- [ ] FLC license entry validated against `^[A-Z0-9-]{4,20}$` regex (defensive; the real validation is the DLSE check).
- [ ] EIN entry validated against `^\d{2}-\d{7}$` regex.
- [ ] Public verified badge appears only when `flcVerifiedAt IS NOT NULL` (RLS + UI both check).
- [ ] Audit log records every state change with admin user id.

## Test scenarios

### Unit

1. `EmployerOnboardingBody` validation: FLC without license → 422 `flc_license_required`. Grower without EIN or county → 422 `grower_fields_required`.
2. Job-publish gate: unverified employer publishing → 403 `employer_not_verified`. Verified → success.
3. Re-verification trigger: PATCH license # → `flcVerifiedAt` cleared.

### Integration

1. **End-to-end approval:** employer submits → admin views queue → admin marks verified → employer can publish a job → public job page shows verified badge.
2. **End-to-end rejection:** admin rejects with reason → employer email sent → employer updates info → status returns to pending → admin approves → unblocked.
3. **Public RLS:** unverified employer's profile and jobs return 404 to anonymous query.
4. **Audit trail:** every state change produces a `verification_log` row.

### Manual

1. Test deep-link buttons in admin UI: DLSE search and SOS search open with prefilled query.
2. Verify email arrival in Gmail and Outlook for both EN and ES locales.

## Definition of done

- All state transitions tested.
- Admin runbook: how to verify an FLC (step-by-step DLSE check), how to verify a grower, how to handle ambiguous cases (license expired but employer claims renewal in progress).
- SLA dashboard in Grafana shows admin queue depth and median wait time.
- Sample test license numbers committed for staging (with admin-mock-verify enabled).
