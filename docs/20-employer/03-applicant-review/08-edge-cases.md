# 03 — Applicant Review: Edge Cases & Risks

## Race: two browser tabs hire the same applicant

Employer has the application open in two tabs, hires from both.

**Mitigation:**

- Hire is a state transition; second hire returns `422 invalid_transition` (already hired).
- Worker receives only one hire SMS (idempotency `app-{appId}-hired`).
- No double-counting of `hireCount` (transition only increments when the row updates).

## Hire wage below posting minimum

Employer offers $15/hr on a posting that says $18-22/hr.

**Decision:**

- UI validates and shows a warning; doesn't block.
- API allows it (employer's negotiation may differ). Logged in `application_events.metadata`.
- Workers see the actual wage in the hire SMS, regardless of posting range.

> **Inferred:** Don't be paternalistic about wage negotiation. The platform's role is transparency, not enforcement. Logging captures patterns for admin review (employer consistently underpays?).

## Applicant withdrew before employer reviewed

Worker withdrew at 9:00. Employer at 10:00 tries to mark Reviewed.

**Behavior:** API returns 422 `invalid_transition`. UI shows banner: "This applicant withdrew their application." Employer sees the withdrawal in the timeline.

## Applicant deleted account before hire

Worker's account is soft-deleted. Application remains.

**Behavior:**

- API still returns the application card with name "[Former applicant]".
- Hire / reject / review buttons disabled.
- Optionally: auto-mark `rejected` with reason `no_response` and a system event.

> **Inferred:** Don't silently complete the hire of a deleted user. Block transitions and let the employer move on.

## Very high applicant volume

A popular posting attracts 200 applicants in 24 hours.

**Mitigation:**

- Pagination on inbox + kanban (50 per status by default).
- Bulk-reject is the escape valve for "I have too many".
- Sort options: newest, skill match, county-distance (Phase 2).

## Hire after auto-fill

Posting hired 2 of 2 → status `filled`. Employer wants to hire 1 more.

**Behavior:** posting must be re-opened (admin) or a new posting created. Re-open → status back to `active`, can hire. Workers who were `applied` are still there.

## Reject reason analytics

Admin runs a report: employers in Tenant 1 reject "not_qualified" 80% of the time → maybe their postings are too generic.

**Mitigation:** out of scope for MVP. Data is captured; reports come Phase 4.

## Discrimination patterns

Employer rejects everyone with a Spanish-only profile. Pattern detectable by admin.

**Mitigation:**

- Admin dashboard (Phase 2): rejection rate by worker language preference.
- If pattern detected, admin reaches out + investigates.
- For MVP, the data is captured (`rejectionReason` enum + `worker.preferredLang`); analytics come later.

> **Inferred:** Discrimination detection is a sensitive area requiring counsel involvement. Capture data, defer analytics until policy is set.

## Note size

`employerNote` capped at 2000 chars. Sufficient for typical use.

## Cross-org sharing (Phase 2)

Employer org has multiple users. They all see the same notes / status. No per-user notes in MVP.

## Worker hires elsewhere mid-process

Worker accepts a job at Employer A; Employer B's application is still in `applied` for the same worker.

**Behavior:** worker can withdraw the B application from their dashboard. No automatic withdrawal. If B hires them anyway and they don't show up: that's an offline matter (employer marks no-show).

## Applicant detail performance

Loading every applicant's full profile in kanban would be slow.

**Mitigation:**

- Kanban shows the card-shape view only (first name + last initial + skill match + county).
- Full profile loaded only when clicking into the detail.

## Hire flow trust

Employer accidentally hires the wrong applicant.

**Mitigation:**

- Hire confirmation modal explicitly names the worker and shows the wage.
- After hire: 5-minute "undo" window where the employer can revert via UI (sends `metadata.silent: true` event so worker SMS isn't already out — actually worker SMS likely already fired, so revert sends a "we made a mistake, please disregard" SMS — out of scope for MVP).
- For MVP: revert only via admin endpoint (rare).

## Kanban drag latency

Slow API → drag-drop feels laggy.

**Mitigation:**

- Optimistic UI: card moves immediately; revert + show toast on failure.
- API target: P95 < 250ms for transition.

## Open questions

1. Two-way messaging worker ↔ employer (Phase 2) — when does it ship? Adds significant scope (moderation, notifications, history).
2. Rating workers — UX is sensitive (could feed discrimination). Defer until specifically asked by partners.
3. Interview scheduling — calendar integration with Google/Outlook. Phase 3.
4. Pre-screen questions on apply ("Do you have transportation?") — adds friction; survey first.
5. Posting boost / promote — paid feature. Phase 3.
