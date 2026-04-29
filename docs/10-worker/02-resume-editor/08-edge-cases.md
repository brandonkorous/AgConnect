# 02 — Resume Editor: Edge Cases & Risks

## Concurrent edits across tabs

Two browser tabs editing the same profile.

**Mitigation:**

- API includes the current `updatedAt` in every response.
- Client sends `If-Unmodified-Since: <updatedAt>` on PATCH (or `expectedUpdatedAt` in body for JSON-only).
- Server returns `409 conflict` if mismatched. UI prompts refresh.
- After refresh, all unsaved edits are lost — explicit user choice, not silent.

> **Inferred:** Optimistic concurrency over operational transformation. Workers rarely edit from multiple devices simultaneously; the simpler model wins.

## Lost edits during network drop

Edit queued client-side; reconnection lossless.

**Mitigation:**

- IndexedDB stores pending edits keyed by `(field, timestamp)`.
- On reconnection, replays in order. Conflicts (server has newer state) prompt the user.
- Save status pill makes pending state visible.

## Re-upload erases manual edits

Worker spent 10 minutes adding a custom certification, then re-uploads → all custom adds gone.

**Mitigation:**

- Confirmation dialog before re-upload spells out: "This will overwrite all sections."
- Backup audit trail: `resume_raw_url` keeps the previous Blob; admin tools can restore.
- Phase 2: resume revisions table (see [02-data-model.md](02-data-model.md)) lets workers browse + restore.

## Skill list grows unbounded

Workers add many "custom" skills via the editor.

**Mitigation:**

- Cap at 20 skills per profile.
- Long custom skills (> 60 chars) rejected.
- Admin reviews common customs and promotes them into the standard list quarterly.

## Date validation

End date before start date; future start dates.

**Mitigation:**

- Zod refinement on `experience` items: `start_date <= end_date`. Future starts allowed (a worker may have a confirmed start date).
- UI shows inline error before save.

## Bullet point profanity / inappropriate content

Worker writes inappropriate content in bullets. Visible to employers.

**Mitigation:**

- Light client-side word filter (warn, don't block) — false positives common; defer to admin moderation.
- Admin flagging tool — out of scope for MVP.
- Term-of-service ban handles repeat offenders.

> **Inferred:** Don't try to be a perfect content moderator. The user base is professional; moderation issues will be rare.

## Email change re-verification

Worker changes their email. Should we re-verify ownership?

**Decision (MVP):** No re-verification. Email is not used for primary auth (phone OTP is). It IS used for cert delivery and notifications, so wrong email means missed messages — visible failure, not security failure.

If/when email becomes auth-critical (e.g., post-MVP password recovery), gate behind verification.

## Phone change

Phone change requires Clerk-side flow (not editor); editor is read-only for phone. UI shows "Change phone in Account Settings" link to Clerk's hosted account page.

## County change → re-locate

Worker moves from Fresno to Tulare and updates county.

**Behavior:** new applications use the new county. Existing applications keep their original `worker_county_at_application` (set at apply time, not refreshed). Job-match queries use the current county.

## Long employer names / titles

User pastes 200-char job title.

**Mitigation:** schema caps at 200 chars on `experience.title`, etc. UI input enforces with `maxLength`. Excess truncated client-side with a count indicator.

## Re-parse loop

Worker re-uploads, doesn't like result, edits, re-uploads again, edits again. Each parse costs $0.05; could rack up.

**Mitigation:**

- Soft rate limit: max 5 re-uploads per worker per day. Beyond that → "Try editing instead" message.
- Cost monitoring (resume parser) catches outliers.

## Conflict between profile edit and onboarding return

Worker mid-onboarding decides to edit instead. Onboarding redirect logic must handle this.

**Mitigation:**

- Editor blocks access if `onboardedAt = null` → redirect to onboarding.
- Onboarding completes normally; editor is post-onboarding only.

## Privacy: edit log visibility

`auth_events` records `worker_profile.updated`. Could be sensitive (name change, address change).

**Mitigation:**

- `auth_events.payload` does NOT contain the full diff for profile updates — only field names that changed. (Audit trail "user changed firstName" without the new value.)
- Full diff available only via admin tooling and only when responding to a support ticket.

## Open questions

1. Resume revision history (Phase 2) — when does grant-reporting need it?
2. Allow workers to upload a photo? Increases data sensitivity. Defer.
3. Bulk import for partner orgs (e.g., training org imports its graduates' info) — out of scope for MVP; design before Phase 3.
