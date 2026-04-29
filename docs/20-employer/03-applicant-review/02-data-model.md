# 03 — Applicant Review: Data Model

This feature reads / writes `applications` and `application_events` defined in [10-worker/04-application-tracker/02-data-model.md](../../10-worker/04-application-tracker/02-data-model.md).

## Additional fields used by this feature

`applications` extension:

```prisma
employerNote        String?  @db.VarChar(2000) @map("employer_note")    // private notes by employer; never shown to worker
rejectionReason     RejectionReason?                                    @map("rejection_reason")  // structured for analytics; not shared
rejectionReasonText String?  @db.VarChar(500) @map("rejection_reason_text")  // optional free-text; private
```

```prisma
enum RejectionReason {
  not_qualified
  too_far
  position_filled
  no_response
  other
}
```

These fields are **never** included in any worker-facing API response. RLS plus API filtering both enforce.

## RLS additions

Already defined in [10-worker/04-application-tracker/02-data-model.md](../../10-worker/04-application-tracker/02-data-model.md). Employer policy already grants ALL operations on applications for their own jobs.

## Indexes

- `applications(jobId, status)` — kanban grouping (already defined)
- `applications(jobId, appliedAt)` — sort order in kanban
- Composite for cross-posting inbox: `(employer_jobId via FK lookup, status, appliedAt DESC)`

## Counters per posting

Aggregate counts are computed live (`SELECT COUNT(*) GROUP BY status`) — see [02-job-postings/03-api.md](../02-job-postings/03-api.md) for `applicationCounts` shape.

For real-time-feeling kanban, use Postgres `LISTEN/NOTIFY` or just polling every 30s (simpler). Out of scope for MVP — staticwise, refresh on focus.

## Notes & rejection reason audit

`employerNote` and `rejectionReasonText` content is sensitive (could be discriminatory if mishandled). Logged accesses:

- Employer reads: not logged (normal).
- Admin reads: logged to `auth_events` with `event_type = 'application.note.read'`.
- Bulk-reject with reason: each rejection logged in `application_events.metadata.rejectionReason`.

> **Inferred:** Don't surface rejection reasons to workers. Rejection messages are uniformly upbeat ("not selected this time"). Reasons are for the employer's own org learning + admin pattern detection.

## Pattern detection (admin, post-MVP)

Admin can run reports like "employer X rejects 90% of bilingual workers" to flag potential discrimination. Out of scope for MVP code; the `rejectionReason` enum makes this possible later.
