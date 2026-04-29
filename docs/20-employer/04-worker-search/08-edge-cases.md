# 04 — Worker Search: Edge Cases & Risks

## PII leakage

The biggest risk. Even minor regressions could expose worker contact info.

**Mitigations:**

- Strict Zod `.strict()` on response schemas — extra fields rejected.
- API-layer redaction with explicit allowlist (NOT denylist) of fields.
- Render-time assertions in UI components (`<WorkerCard>` throws if `phone` is present).
- Integration test: send a fake worker with phone set, search returns it, assert response.body doesn't include the phone.

## Spam invites

Bad-actor employer invites every worker in the county to every posting.

**Mitigations:**

- Per-employer-per-day invite cap: 50 invitations/day. Out of scope for MVP code; track via `worker_invitations` count and add when needed.
- Per-worker invite cap: 1 invitation per `(employer, worker, job)` lifetime (UNIQUE constraint).
- Workers can opt out of all invitations via profile setting (Phase 2).
- Admin alert if an employer sends > 100 invitations/week.

## Worker discovers they're searchable

Some workers may not realize they're searchable. Privacy expectation gap.

**Mitigation:**

- Onboarding terms-of-service explicitly states: "Verified employers can search for you by skill and county. They cannot see your phone or email until you apply or accept an invitation."
- Profile setting (Phase 2): "Hide me from search" toggle.

> **Inferred:** Default-on visibility is the platform's value proposition (matching workers to opportunities). Hiding is opt-in. If worker pushback at launch, flip the default.

## Match-score gaming

Employer notices `matchScore` correlates with apply rate; tries to game by adding many irrelevant skills to filter.

**Behavior:** harmless — worker still has to apply. Match score is not displayed to the worker.

## Cert-filtering bypass

Worker self-reports a certification (in `worker_profiles.certifications`). Employer filters for that cert; gets the self-reported worker mixed with AgConn-verified workers.

**Decision:** the search filter `certTopics` matches against `enrollments` (AgConn-verified) only. Self-reported certs do NOT satisfy the cert filter.

> **Inferred:** Employers searching by cert want verified holders. Self-reported certs visible in the profile but not searchable as filters. Adjust if employers complain.

## Stale availability

Worker set availability 6 months ago and hasn't updated. Search uses old data.

**Mitigation:**

- Show `worker_profiles.updatedAt` on the worker card so employers know how recent the data is.
- Workers are nudged via dashboard prompts to keep availability fresh (Phase 2).

## Invitation expiry

Invitations should auto-expire to avoid clutter.

**Mitigation:**

- Cron: invitations not accepted/declined within 30 days → set `expiredAt`. Invitations beyond this don't surface in worker UI.
- Out of scope for MVP code; add when invitation volume warrants.

## Cross-tenant isolation in search

A worker can only be searched within their own tenant.

**Mitigation:** the search query joins `worker_profiles` and filters by `tenant_id = current_setting('app.tenant_id')`. Tested in cross-tenant integration tests.

## Search query injection

Free-text `q` parameter passed to FTS or LIKE.

**Mitigation:** use parameterized queries; limit to 120 chars; strip non-word characters before passing to FTS. Same pattern as job-discovery search.

## Worker phone format change

Worker re-onboards with a new phone. Existing invitations still link to their `userId`. Invite SMS routes to the new phone.

**Behavior:** correct.

## Employer downgrades to Free with active invitations

Pending invitations (not yet accepted/declined) — should they remain valid?

**Decision:** invitations are immutable artifacts. They remain visible to the worker; if the worker accepts, the application is created normally. The employer can review the application even on Free plan (applicant review is not Pro-gated).

The Pro-gating is on the act of _creating_ invitations; existing ones stand.

## Worker complaints

Worker reports an employer for inappropriate invite content.

**Mitigation:**

- `worker_invitations.message` capped at 500 chars and logged.
- Admin can read complaints + the message content.
- Admin can disable an employer's search/invite ability (privateMetadata flag) without revoking subscription.
- Out of scope for MVP code; manual via admin tooling.

## Open questions

1. Worker opt-out from search — default off for MVP, but this needs a real worker UX. Before tenant #2.
2. Boolean / advanced search (Phase 2) — does it justify the UX complexity? Probably not; chip filters handle 95% of cases.
3. Saved worker shortlists — Phase 2.
4. Two-way messaging — Phase 2 unlocks more value but adds substantial moderation surface.
5. Distance / radius filtering — needs geocoding pipeline. Phase 2 alongside job search.
