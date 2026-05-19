# Phase 4 — Employer SMS

Severity: P1, lowest priority. Last. Deliberately minimal.

Employers are email-first and onboard through the gated web reference path
(`employer/(shell)/layout.tsx:28-44` → `POST /v1/employer/onboarding` atomic
bootstrap). There is **no employer SMS onboarding wizard**.

## Tasks

- **Reuse the keystone.** Employer phone consent-capture parity via the Phase 1
  `ensureClerkUserByPhone` primitive — no employer-specific identity path.
- **STOP handling** for employer-associated numbers, consistent with worker opt-out
  semantics.
- Expand only if employer SMS demand materializes; otherwise stop here.

## Status — IMPLEMENTED 2026-05-18 (typecheck + check:conventions clean)

- **Consent parity:** `webhooks/clerk.ts` `web_otp` writer guard broadened from
  `role === worker` to `worker || employer`. A phone-verified employer
  (`EmployerSignUpForm` phone mode → `unsafeMetadata.role='employer'`) now records
  `consentMethod='web_otp'` + `consentedAt` via the **same** `recordWebOtpConsent`
  keystone writer — no employer-specific identity or consent path. Still guarded by
  `consentMethod:null` (idempotent, never clobbers `sms_double_opt_in`) and excludes
  `provisionedVia='sms'`. `training_org`/`admin` intentionally not eligible.
- **STOP:** verified already correct with **no change** — `handleStop` upserts
  `sms_opt_out` keyed by phone, role-agnostic, and the inbound STOP branch
  (`twilio.ts:177`) fires before any user lookup. Employer-associated numbers are
  opted out identically to workers, consistent with worker opt-out semantics.
- **No employer SMS wizard:** the inbound webhook still only provisions/onboards on
  `role: worker` lookups; employers texting opt-in keywords get no onboarding flow
  (by design — they onboard via the gated web reference path).

Deferred: none for this phase. Tests deferred per owner (no repo test framework) —
when added: assert employer phone signup records `web_otp`; assert employer STOP
writes `sms_opt_out`; assert SMS-provisioned identity still excluded.

## Done when

An employer phone can be consent-captured and STOP-handled via the shared primitive,
with no new employer identity or onboarding surface introduced. (Met as of
2026-05-18; runtime verification pending tests + an app-run.)
