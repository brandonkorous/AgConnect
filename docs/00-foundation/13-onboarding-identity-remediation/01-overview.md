# 13 — Onboarding & Identity Remediation: Overview

Status: planned, owner-approved 2026-05-18. Branch: `feat/onboarding-identity-remediation`.

This folder is the authoritative spec for closing the onboarding/identity gaps found
2026-05-18. Companion visual artifacts (review aids, not source of truth):
`~/.agent/diagrams/agconn-onboarding-architecture.html` (current state),
`~/.agent/diagrams/agconn-onboarding-remediation-plan.html` (this plan).

## The core problem

The platform has **two independent identity origins** that cannot see each other:

- **Clerk-first** (web sign-up) → `User.id` is the Clerk `user_*` id.
- **SMS-first** (texts `JOBS`, never touches Clerk) → `startOptIn` mints a synthetic
  `sms_*` `User` with no Clerk id (`services/api/src/webhooks/twilio.ts:197-241`).

`User.id` *is* the Clerk userId (`packages/db/prisma/schema.prisma:484`, no separate
`clerkId` column). Every authed surface resolves the caller via
`prisma.user.findUnique({ id: clerkAuth.userId })` (`services/api/src/middleware/adminContext.ts:35`)
behind `auth.protect()` (`apps/web/src/proxy.ts`). A Clerk session therefore can
**never** resolve an `sms_*` row. The SMS-first worker — the monolingual-Spanish,
no-web person this channel exists for — is consented, flagged `onboarded=true`, has
**no `WorkerProfile`** (so invisible to `automatch`, unhireable), is locked out of
every web surface, and forks a second orphaned identity if they ever sign up. The
`sms_* → user_*` merge referenced at `twilio.ts:200` was never written.

Secondary defects (full list: [07-acceptance.md](07-acceptance.md)): worker web
onboarding never finalizes and 404s after the `/onboarding → /worker/onboarding`
move; no web consent capture (`web_otp` documented but never written); `/worker` and
`/field` are ungated.

## Decisions locked

1. **Phone-anchored identity.** Inbound SMS from an unknown phone triggers API-side
   Clerk user provisioning (idempotent ensure-by-phone). `User.id == Clerk id`
   **always**. The `sms_*` synthetic id is removed entirely. Clerk phone-uniqueness
   performs the dedupe — no merge algorithm is needed.
2. **SMS micro-onboarding is in scope** as Phase 3 (sequenced, not deferred). A Clerk
   identity is not a `WorkerProfile`; without county+skills the worker is still
   unmatchable.
3. **Employers are email-first.** Employer SMS is Phase 4, lowest priority, minimal.
4. **Gate `/worker` and `/field`** by mirroring the proven employer
   `apps/web/src/app/[locale]/employer/(shell)/layout.tsx:28-44` redirect pattern.
5. **New invariant: `consent != onboarded`.** Consent = permission to message;
   onboarded = profile complete enough to match/hire. `confirmOptIn` must stop
   setting `onboarded=true` (`services/api/src/webhooks/twilio.ts:243-256`).

## Sequencing

- **Phase 0** ([02](02-phase-0-recon.md)) blocks all phases. Small.
- **Phase 1** ([03](03-phase-1-identity.md)) is the keystone. After Phase 0.
- **Phase 2** ([04](04-phase-2-worker-web.md)) runs parallel to Phase 1 (separate
  surfaces). After Phase 0.
- **Phase 3** ([05](05-phase-3-sms-onboarding.md)) depends on Phase 1.
- **Phase 4** ([06](06-phase-4-employer-sms.md)) last.

Acceptance per phase: [07-acceptance.md](07-acceptance.md). Risks and out-of-scope:
[08-risks-and-scope.md](08-risks-and-scope.md).
