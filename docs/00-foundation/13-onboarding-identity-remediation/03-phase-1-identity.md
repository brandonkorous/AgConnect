# Phase 1 — Identity Keystone

Severity: P0. Depends on Phase 0. Foundation for Phase 3. Goal: collapse the two
identity origins into one Clerk-backed identity so the merge problem ceases to exist.

## 1.1 `ensureClerkUserByPhone` primitive

New server function in `packages/auth` (the Clerk wrapper package):

```
ensureClerkUserByPhone(phoneE164: string, opts: { role: UserRole; locale: Lang })
  -> Promise<{ clerkUserId: string; created: boolean }>
```

Logic:

1. `clerk.users.getUserList({ phoneNumber: [phoneE164] })` → if a user exists,
   return its id (`created:false`).
2. Else `clerk.users.createUser({ phoneNumber: [phoneE164], unsafeMetadata: { role,
   locale }, skipPasswordRequirement: true })` with the phone marked verified
   server-side. Return new id (`created:true`).
3. On Clerk 422 "phone number taken" (concurrent race) → re-run step 1 and return
   the existing id.

Mirrors the existing opposite-direction primitive `provisionFromClerk`
(`services/api/src/middleware/authContext.ts:60`). Phone input MUST pass through the
shared normalizer from Phase 0 (0.4).

## 1.2 Async `sms.provision` pg-boss job

Inbound SMS must not block on a Clerk network call (Twilio fast-response). New job on
the `@agconn/sms` queue pattern. Consumer:

1. `ensureClerkUserByPhone(phone, { role: worker, locale })`.
2. Idempotent `User` upsert keyed by the returned Clerk id: `{ id: clerkUserId, role:
   worker, phone, preferredLang, smsOptInState: 'pending_confirm' }` — the same
   idempotent upsert shape as the webhook at `services/api/src/webhooks/clerk.ts:106-128`.
3. Enqueue the existing `sms.optin.confirm` reply.

Idempotent on `(phone)`; retried; safe under duplicate inbound.

## 1.3 Rework the inbound webhook

`services/api/src/webhooks/twilio.ts`:

- Unknown phone + opt-in keyword → **enqueue `sms.provision`** instead of
  `startOptIn`. Remove the `sms_${randomBytes}` id minting and the direct
  `tx.user.create` (`twilio.ts:197-241`).
- Webhook still returns TwiML immediately.
- STOP / confirm / keyword routing already resolves the user by `phone`
  (`findFirst({ where: { phone } })`) — unchanged, now finds the `user_*` row.
- Remove the stale "see TODO in webhooks/clerk.ts" comment at `twilio.ts:200`;
  document the new model in `clerk.ts` and [01-overview.md](01-overview.md).

## 1.4 Decouple consent from onboarded

`confirmOptIn` (`twilio.ts:243-256`): keep the consent write
(`consentMethod='sms_double_opt_in'`, `consentedAt`, `smsOptInState='consented'`) but
**remove `onboarded: true`**. Onboarding is now Phase 3's job. This is the
`consent != onboarded` invariant.

## 1.5 Web consent capture (`web_otp`) — DONE

Implemented **server-side in the Clerk `user.created`/`user.updated` webhook**
rather than via a `WorkerSignUpForm` call. This is race-free (the `User` row is
written in the same transaction), correctly timed (consent recorded the moment a
phone-verified worker identity is mirrored — TCPA-correct), and needs no client
change.

- `services/api/src/lib/consent.ts` → `recordWebOtpConsent(db, userId)`:
  `updateMany({ where:{ id, consentMethod:null }, data:{ consentMethod:'web_otp',
  consentedAt } })`. The `consentMethod:null` guard makes it idempotent and unable
  to clobber an existing `sms_double_opt_in`.
- `ensureClerkUserByPhone` stamps `privateMetadata.provisionedVia='sms'`
  (server-only, unspoofable) on the users it creates. The webhook calls
  `recordWebOtpConsent` only when `role===worker && phone && provisionedVia!=='sms'`,
  so SMS-provisioned identities are excluded — their consent is
  `sms_double_opt_in`, written by `confirmOptIn` on YES.
- Email-only signups (no phone) stay `consentMethod=null` (nothing to consent to).

`confirmOptIn` remains the SMS-side writer (unchanged). Two writers, both correct,
neither clobbers the other.

## 1.6 Legacy `sms_*` rows — no data migration

Owner confirmed there are **zero `sms_*` users in production** (Phase 0.1). There is
no data to migrate. This task reduces to **removing the `sms_*` code path** (done in
1.3) and asserting via test that no `sms_*` id can be produced. No migration script,
no PK re-key, no transactional cascade. If a non-prod environment has stray stubs,
delete them directly — they carry no real user data.

## Done when

No code path mints `sms_*`; an inbound `JOBS` from a new phone yields a `user_*`
`User`; `confirmOptIn` no longer sets `onboarded`; web phone-verify records
`web_otp`; legacy rows migrated; tests green — ensure-by-phone idempotency under
concurrent inbound, provision-job retry, `confirmOptIn` on a provisioned user, and an
assertion that **no `sms_*` is ever created**.
