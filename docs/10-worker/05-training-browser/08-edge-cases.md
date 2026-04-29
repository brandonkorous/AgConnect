# 05 — Training Browser: Edge Cases & Risks

## Concurrent enrollments / overbooking

Two workers tap Enroll simultaneously when 1 spot remains.

**Mitigation:** atomic SQL:

```sql
UPDATE training_programs
SET enrolled_count = enrolled_count + 1,
    status = CASE WHEN enrolled_count + 1 >= capacity THEN 'full' ELSE status END
WHERE id = $programId
  AND enrolled_count < capacity
  AND status = 'active'
RETURNING id;
```

If 0 rows updated, return `409 program_full`. The DB is the arbiter; concurrency-safe.

## Program time changes after enrollments

Org changes `startDate` from Apr 25 to May 5 with 12 enrolled workers.

**Behavior:** allowed. Reminder flags don't auto-reset — must be manually reset, OR (preferred) reminders re-fire because the new start date is now > 48h away from "now" again. Implementation:

- Date change resets `reminderSent48h = false`, `reminderSent2h = false` for all `enrolled` enrollments.
- Notification SMS to enrolled workers about the time change:

| | EN | ES |
|---|---|---|
| Body | The start date for {programTitle} changed to {startDate}. Reminders will follow. | La fecha de inicio de {programTitle} cambió a {startDate}. Los recordatorios seguirán. |

Template `training.rescheduled`. Out of scope for MVP if no orgs need it; behavior confirmed in Phase 3 testing.

## Program canceled with completed enrollments

Already-completed enrollments shouldn't be affected by program cancellation.

**Mitigation:** cancellation only flips `enrolled` → `dropped`; `completed` enrollments stay. Their certificates remain valid.

## Reminder fires for a dropped worker

A worker dropped 30 minutes before the 2h reminder. Should they still get it?

**Behavior:** dispatcher filters `WHERE status = 'enrolled'`. Dropped workers don't get reminders.

## Reminder spam from re-fire

Cron runs every 15 min; same 48h-ahead enrollment in window for multiple cron cycles.

**Mitigation:** `reminderSent48h` flag is checked AND set in the same SQL transaction:

```sql
UPDATE enrollments
SET reminder_sent_48h = true
WHERE id = $id AND reminder_sent_48h = false
RETURNING id;
```

If 0 rows updated, the SMS was already sent (or will be by another cron cycle). Skip.

## Worker enrolls in overlapping programs

Worker enrolls in two programs that overlap in time. Platform doesn't prevent.

**Behavior:** by design — workers can enroll in multiple programs and choose which to attend. No enforcement.

> **Inferred:** Some training orgs would prefer to know about overlap (no-show predictor). Phase 2: warn-on-overlap UX.

## Cert generation failure

Org marks completion; cert job fails (parser, blob upload, etc.).

**Mitigation:**

- pg-boss retries 3× with backoff.
- After exhaust: Sentry alert; admin re-fires manually via `/admin/v1/enrollments/:id/regenerate-cert`.
- Worker doesn't see "Completed" until `cert_url` is set — defer the worker-visible status update until cert is ready.

> **Inferred:** Worker UI can show "Completed — generating certificate…" briefly. If it takes > 5 minutes, show "Certificate processing — we'll text you when it's ready" and rely on the SMS to notify.

## Capacity reduced after enrollments exceed new capacity

Org reduces capacity from 20 to 15 when 18 already enrolled.

**Mitigation:**

- Reject the change if `capacity < enrolledCount`. Admin only can override.
- Admin can drop excess enrollments manually (with cancellation SMS).

## Workers without phone enrolling

Workers must have phone (per onboarding). Programmatic invariant.

**Mitigation:** API enforces `users.phone NOT NULL` for enrolling workers. If somehow null (admin tool drift), reject with 422 `phone_required`.

## Org-side bulk mark errors

Org marks all 20 workers complete, but 1 was actually a drop.

**Mitigation:**

- Bulk mark complete UX shows the worker list with checkboxes; default "all selected" but org reviews before confirming.
- After bulk, individual revert allowed (mark dropped — reverses cert generation: cert deleted, worker SMS "your status was corrected").

> **Inferred:** Reverting completion is sensitive (cert was issued). Mark a `revoked: true` flag on the enrollment; cert remains in Blob (audit) but is hidden from worker's UI. Don't email "your cert is revoked" — quietly correct unless the worker asks.

## Privacy: roster visibility

Org sees worker phone for enrolled workers — needed for outreach (no-show calls).

**Mitigation:** logged access to `roster` endpoint via `auth_events` for audit. Org access removed when user role changes (Clerk webhook).

## Calendar invite (.ics) timezone

`.ics` files use floating local time vs. fixed UTC. Wrong timezone in the invite causes calendar drift.

**Mitigation:** generate `.ics` with `TZID=America/Los_Angeles`. Test in iOS Calendar, Google Calendar, Outlook before launch.

## SEO drift

Old programs (past) shouldn't appear in sitemap.

**Mitigation:** sitemap query filters `endDate >= now() OR createdAt > now() - interval '30 days'`. Program pages return 410 Gone after `endDate + 30 days`.

## Open questions

1. Wait-list when program full — Phase 2 priority?
2. Multi-session attendance tracking — when do orgs need it? Some grants require per-session attendance.
3. Online / hybrid programs — when do orgs adopt? Adds Zoom-link rendering, attendance tracking, etc.
4. Enrollment quotas per worker (e.g., one CDFA program per quarter) — grant-funded programs may have rules. Confirm with grantee orgs.
