# 04 — Application Tracker: Edge Cases & Risks

## Race condition: dual apply

User double-taps Apply. Two concurrent requests.

**Mitigation:**

- Database UNIQUE constraint on `(jobId, workerId)` is the durable defense.
- API handles the resulting unique-violation error and returns the existing application as 409 (or returns it as success, idempotent — TBD per UI preference).
- Client disables the Apply button on tap to limit the window.

## Job closed between view and apply

Worker sees job, taps Apply 30 seconds later, but the employer just filled it.

**Behavior:** API returns `422 job_not_active`. UI shows "This job was just filled. Here are similar jobs:" with recommendations.

## Worker applies, then deletes profile

Worker apply, then their profile is deleted (admin action).

**Behavior:** `applications.workerId` still references the user row. The user row is soft-deleted; their applications remain (employer side may need them for grant reporting). When admin views the application, the worker name shows "[Deleted user]".

## Hire without wage

Employer somehow triggers hire without wage. Schema requires it but defensive checks needed.

**Mitigation:**

- API enforces `wageOffered NOT NULL` for `hired` status at application layer.
- DB CHECK constraint:

```sql
ALTER TABLE applications ADD CONSTRAINT hired_requires_wage
  CHECK (status != 'hired' OR wage_offered IS NOT NULL);
```

## Status reverted

Employer accidentally clicks Hire, then wants to revert. State machine doesn't allow `hired → reviewed`.

**Mitigation:**

- Admin can revert via `/admin/v1/applications/:id/revert` (audit-logged).
- The reverted action triggers a `silent: true` event so workers don't get whiplash SMS.
- Alternative: design a "pending hire" intermediate state that requires confirm — out of scope for MVP.

> **Inferred:** Reverting hire is rare; making it admin-only protects against employer mistakes affecting the worker's experience.

## Worker withdraws after hire

State machine forbids; UI hides Withdraw button on hired.

**If the worker no longer wants the job after being hired**, the employer should mark it `rejected` after a conversation, OR the application stays `hired` and the actual no-show is handled offline. Out of scope to model "worker quit after hire" — that's an HR concern between worker and employer, not the platform.

## Duplicate notifications

Webhook re-fires, queue re-runs, etc.

**Mitigation:** notification jobs use `singletonKey: app-{appId}-{toStatus}` so re-triggers are idempotent.

## Multilingual employer ↔ worker mismatch

Employer types message in EN; worker reads SMS in ES. Templates handle the worker side. No real-time message translation in MVP.

> **Inferred:** Don't auto-translate user-generated message content — the LLM cost and the trust risk (mistranslation) outweigh the convenience. If two-way messaging ships post-MVP, add translation as an opt-in.

## Snapshot fields drift

`skillsAtApply` is a snapshot. Worker updates skills 6 months later — the snapshot remains. Reports use the snapshot.

**Behavior is correct.** Grant reports reflect the worker's state at the time of the platform interaction.

## Worker without phone hired

Worker signed up, then somehow lost their phone (admin updated to null), then hired.

**Mitigation:** Apply flow requires phone via Clerk OTP, so all workers have a phone. Admin tools that null phones are blocked at the user level (don't allow null phone for an active worker).

## Privacy: applicant info to employer

The employer sees the worker's first name, last name, county, skills, certifications. NOT the resume raw file (audit-only, admin-restricted).

**Behavior:** confirmed via the apply confirmation copy — workers know exactly what's shared.

## Long-running employer review

Application sits in `applied` for weeks; employer never reviews.

**Mitigation:**

- Optional: stale-applicant reminder email to the employer at 7 days, 14 days. Out of scope for MVP.
- Worker UI shows applied date prominently; some workers will withdraw based on inactivity.

## SMS floods

Worker hires from 3 employers in one minute. They get 3 SMS in rapid succession.

**Behavior is correct.** Each is a different application. Workers expect this when they're actively job-hunting.

## Application before profile complete

User signs up, hits Apply on a job before completing onboarding.

**Behavior:** API returns `403 not_onboarded`; UI redirects to onboarding flow with `?return_to=/jobs/<slug>/apply`.

## Open questions

1. Cover letter / worker note (Phase 2) — does it improve hire rates? Survey post-MVP.
2. Re-apply after rejection — when's the policy? Default: never re-apply (one app per pair). If employer wants to give a worker a second look, they un-reject in admin tooling.
3. "View other applicants" for hired workers — out of scope. Workers don't see other applicants.
4. Notification preferences (mute SMS, prefer email only) — Phase 2 setting on `users`.
