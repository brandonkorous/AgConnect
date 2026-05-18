// audit-required:exempt — the sole caller is the Clerk user.created/updated
// webhook, whose every event is durably recorded in the auth_events table
// (same provenance basis as webhooks/clerk.ts itself). A separate audit_events
// row would duplicate that with weaker provenance.
import type { Tx } from '@agconn/db';

// SMS A2P consent writer for the web path (identity keystone,
// docs/00-foundation/13-onboarding-identity-remediation/ §1.5).
//
// INVARIANT consent != onboarded. This records "permitted to message" only.
//
// The SMS side (`sms_double_opt_in`) is written by confirmOptIn in
// webhooks/twilio.ts at the moment the worker replies YES. The web side
// (`web_otp`) is written here, from the Clerk user.created/updated webhook,
// the moment a phone-verified worker identity is mirrored — the correct TCPA
// timing, and race-free (the User row exists in the same transaction).
//
// Guarded by `consentMethod: null` so it is idempotent and can never
// overwrite an existing `sms_double_opt_in` (or a prior `web_otp`).

export async function recordWebOtpConsent(db: Tx, userId: string): Promise<void> {
  await db.user.updateMany({
    where: { id: userId, consentMethod: null },
    data: { consentMethod: 'web_otp', consentedAt: new Date() },
  });
}
