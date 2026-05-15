# 01 — Worker Onboarding: Edge Cases & Risks

## Phone collision

**Scenario:** Phone already exists on a different worker `User` row (e.g., user re-registered after support deleted their account, or Clerk session was lost and they signed up again).

**Behavior:** Workers are platform-level — `User.tenantId` is null for every worker — so phone uniqueness is enforced platform-wide across `role = 'worker'`. `POST /v1/onboarding/start` returns `409 phone_collision`. UI shows the i18n string `phone.collision`. Admin tooling for merge is out of scope for MVP; in practice this requires support ticket → manual DB stitch.

> **Inferred:** Phone uniqueness is not enforced between a worker and an employer-user with the same number — the two live in different tenancy buckets and the collision check is scoped to `role = 'worker'`. Revisit if support tickets show employers and their workers re-using a single phone in confusing ways.

## Resume parser hallucination

LLM-based parsers can fabricate experience or skills not in the source.

**Mitigations:**

- Parser response includes a `confidence` per field (low / medium / high) — see [00-foundation/07-resume-parser](../../00-foundation/07-resume-parser/).
- UI highlights low-confidence fields with a "Verify this" badge.
- Original Blob URL preserved (`resume_raw_url`) so admin can audit any disputed parse.
- Worker reviews every field before save; nothing is auto-applied to the public profile without their pressing Continue on the profile review screen.

## OTP delivery failure

Twilio delivery to certain rural carriers fails silently or is delayed.

**Mitigations:**

- Show "Resend code" after 60s (faster than the typical Clerk default of 90s).
- After 2 resend cycles, offer "Try a different number" link → restart flow.
- Log Clerk's SMS delivery webhooks to `auth_events`; admin dashboard surfaces OTP failure rate by carrier.

## Connectivity drops mid-upload

**Mitigation:**

- Resume upload uses XHR with progress events; on failure, show "Upload paused — retry" with a retry button. No silent retry to avoid duplicate parses.
- After successful upload, parse status is server-side; closing the tab is fine — the user resumes via `GET /v1/onboarding/resume/status` on next load.

## County not in the 5-county list

**Scenario:** A worker who lives in Stanislaus County wants to use AGCONN.

**Behavior:** They see the "I'm in another county" link → waitlist form. Account remains live but `worker_profiles.county` stays null and `onboardedAt` stays null — they cannot apply for jobs. When AGCONN expands to their county (admin updates County enum + Prisma migration), an outbound campaign re-engages them.

> **Inferred:** Waitlist users do NOT receive job alerts (since they have no county). They get a one-time confirmation SMS in their `preferredLang`. Confirm with product before launch.

## Skills picker mismatch with resume

Resume parser may extract skills not in our standard list. UI shows them as user-tagged "custom" chips (still saved in `skills[]`, just not in the default list). Search/match treats them as case-insensitive substrings; admin can periodically promote popular customs into the standard list.

## Compliance: minor signups

US Department of Labor restricts farm work for under-16. AGCONN should not facilitate underage placement.

> **Inferred:** Add age confirmation step in onboarding — "Are you 16 or older?". If no → soft-block with explanation in EN/ES. Birthdate not collected (privacy minimization). Re-validate at first job apply with the same affirmation. **This is a MUST-fix before launch — confirm legal language with counsel.**

## Data minimization

- Don't collect SSN, work auth status, or immigration status. Ever. These belong only in WIOA/CalJOBS submitted by the grantee org, not in AGCONN.
- Phone is hashed (`phoneHash`) for matching but the cleartext is stored to send SMS — there's no way around this. Encrypt at rest via Azure Postgres TDE.
- Resume raw file (`resume_raw_url`) is kept for audit — but accessible only to admin and the owning user. Never to employers. Employers see the parsed JSON rendered as a profile, not the original document.

## Accessibility regression

Onboarding is a critical path and a regression frontier. Pin a Lighthouse a11y score gate (≥ 95) in CI **on the onboarding routes specifically**, not just average. CI script: `npm run lighthouse:onboarding`.

## Privacy: shoulder surfing

The OTP screen and the profile editor display PII. On mobile, ensure no PII renders in the screenshot taken for app-switcher previews. Use `window.visibilityState` to blur the OTP input when backgrounded.

## Tenant inference reliance

The MVP "default to the only tenant" path is a footgun for the second tenant. Track this as a known item; require an explicit tenant resolution mechanism (subdomain or invite-link) before launching tenant #2.

## SMS opt-out compliance

US carriers require honoring STOP. Twilio handles this automatically — but the welcome SMS must include "Reply STOP to opt out" / "Responde STOP para cancelar" in both languages. Once a user opts out, no further SMS from any AGCONN number; in-app messaging continues to work.

`sms_log` records `opted_out_at` per user. Job-alert SMS templates check this flag before send.

## Re-onboarding

If admin clears `onboardedAt` (e.g., policy change requires a re-affirmation), user is re-routed through onboarding. They keep their existing data; the flow short-circuits any step that's still complete and surfaces only the new requirement (e.g., a new privacy affirmation screen).

This isn't built in MVP but the data model supports it: `onboardedAt` is the single source of "are they done?".

## Open questions

1. Age affirmation legal copy — needs counsel review. Currently a TODO blocker.
2. Welcome email content — does product want a 3-card format or a single CTA? Drafted as 3 cards in [06-messaging.md](06-messaging.md).
3. Should waitlist users get periodic re-engagement SMS, or only a one-shot confirmation? Privacy posture suggests one-shot.
4. Photo upload — explicitly out of scope but employers have asked for it. When/if added, age and consent requirements need re-review.
