# Acceptance — Verifiable Done-State Per Phase

| Phase | Verifiable done-state | Key references |
|---|---|---|
| 0 · Recon | `sms_*` count recorded in [02](02-phase-0-recon.md); Clerk create-verified-phone + MAU + phone-uniqueness confirmed in writing there; consent matrix in schema + docs; one shared E.164 normalizer, web call sites consuming it. | `schema.prisma:493-507`, `05-sms-pipeline/` |
| 1 · Identity | No path mints `sms_*`; new-phone `JOBS` → `user_*` `User`; `confirmOptIn` no longer sets `onboarded`; web phone-verify writes `web_otp`; legacy rows migrated; idempotency/retry tests green; assertion that no `sms_*` is ever created under concurrent inbound. | `twilio.ts:197-256`, `authContext.ts:60`, `clerk.ts:106-128` |
| 2 · Worker web | Wizard completes with zero 404s; `onboarded`/`onboardedAt` set on finalize; incomplete → 422; availability persisted server-side; un-onboarded worker redirected from `/worker` and `/field`. | `onboarding-actions.ts:52`, `service.ts:164-197`, `(shell)/layout.tsx:28-44` |
| 3 · SMS onboarding | SMS-only worker completes name/county/skills (EN+ES), becomes `automatch`-visible, gets a real digest on `JOBS`, never hits silence; waitlist + holding-reply covered. | `automatch.ts`, `twilio.ts:177`, `10-worker/01-onboarding/07-acceptance.md:10` |
| 4 · Employer SMS | Employer phone consent-captured + STOP-handled via the shared primitive; no new employer identity/onboarding surface. | `packages/auth` |

## Cross-cutting invariants (must hold across all phases)

- **`consent != onboarded`** enforced everywhere. Consent is permission to message;
  onboarded is profile-complete-enough-to-match.
- `GET /v1/me` exposes `onboarded` (gating depends on it).
- All new SMS copy is bilingual via `translation_keys` (seed + reseed, never edit
  `messages/{en,es}.json`).
- Audit events for provision / consent / onboarding-complete via the existing
  `emitSystemAudit` pattern.
- Single E.164 normalizer is the only phone-formatting path (Clerk, Twilio, DB).
