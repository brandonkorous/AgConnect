# 04 — Application Tracker: API (Worker Side)

Employer-side endpoints (`/v1/employer/applications/*`) live in [20-employer/03-applicant-review/03-api.md](../../20-employer/03-applicant-review/03-api.md).

## POST /v1/jobs/:jobId/apply

Apply to a job. Worker must be authenticated and onboarded.

Request body: empty (auto-fills from worker profile and job snapshot).

Server logic:

1. Verify worker has `onboardedAt != null`. If not → `403 not_onboarded`.
2. Verify job exists, status = `active`, not deleted, in worker's tenant.
3. Verify no existing `(jobId, workerId)` pair (UNIQUE constraint backstop).
4. Snapshot `countyAtApply` and `skillsAtApply` from `worker_profiles`.
5. Insert `applications` row with status = `applied`.
6. Insert `application_events` row (`fromStatus: null`, `toStatus: applied`).
7. Enqueue:
   - SMS to worker: `application.applied`
   - Email to employer: `application.applied`
8. Return the new application.

Response:

```ts
const ApplyResponse = z.object({
  application: ApplicationSchema,
});
```

Errors:

| code | http |
|---|---|
| `not_onboarded` | 403 |
| `job_not_found` | 404 |
| `job_not_active` | 422 |
| `already_applied` | 409 |

## GET /v1/applications

List the worker's applications.

Query: `?status=active|hired|closed&limit=20&cursor=...`

`active` → status in `(applied, reviewed)`
`hired` → status = `hired`
`closed` → status in `(rejected, withdrawn)`

Response:

```ts
const ApplicationsResponse = z.object({
  applications: z.array(ApplicationSchema.extend({
    job: JobCardSchema,
  })),
  nextCursor: z.string().nullable(),
});
```

## GET /v1/applications/:id

Single application detail with full status timeline.

```ts
const ApplicationDetailResponse = z.object({
  application: ApplicationSchema,
  job: JobFullSchema,
  events: z.array(ApplicationEventSchema),
  employer: EmployerCardSchema,
});
```

## POST /v1/applications/:id/withdraw

Worker withdraws their application.

Server:

1. Verify status in `(applied, reviewed)` — can't withdraw after hire/reject.
2. Update `status: 'withdrawn'`, set `withdrawnAt`.
3. Insert `application_events` row.
4. Enqueue email to employer: `application.withdrawn` (no SMS for employers — email is fine).
5. Return updated application.

Errors: `cannot_withdraw_at_status` (422) if status = hired/rejected/withdrawn.

## Status change events (handled by employer endpoints)

Employer-triggered transitions (`reviewed`, `hired`, `rejected`) fire:

- SMS to worker: `application.reviewed` / `application.hired` / `application.rejected`
- Email to worker (only on `hired`): `application.hired`
- Insert `application_events` row

These are detailed in [20-employer/03-applicant-review/03-api.md](../../20-employer/03-applicant-review/03-api.md).

## Idempotency

Apply uses the `(jobId, workerId)` UNIQUE constraint as the idempotency mechanism. A double-tap from the worker's UI returns the existing application (200) rather than 409, optionally — TBD.

> **Inferred:** Return 409 explicitly so the UI can show "You already applied" rather than silently treating a double-click as a new apply. Less surprise for the worker.

## Errors

| code | http | when |
|---|---|---|
| `not_authenticated` | 401 | applying without sign-in |
| `not_onboarded` | 403 | worker hasn't completed onboarding |
| `job_not_found` | 404 | unknown job |
| `job_not_active` | 422 | job draft / closed / filled / deleted |
| `already_applied` | 409 | duplicate apply |
| `cannot_withdraw_at_status` | 422 | withdraw after hire/reject |
| `cross_tenant` | 404 | (RLS) job in another tenant — appears as not found |
