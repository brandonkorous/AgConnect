# Risks & Scope

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Clerk on the inbound SMS critical path (latency / outage / rate limit). | Async `sms.provision` pg-boss job + retry + a calm holding reply. Never silence, never a half-state. The Twilio webhook returns TwiML immediately and enqueues. |
| `sms_*` migration with FK children (re-keying a PK). | Phase 0.1 census first; dry-run mode; explicit `BEGIN/COMMIT` (Prisma migrate is not transactional here — `[[feedback_prisma_migrate_not_transactional]]`); idempotent re-runnable script. |
| Phone-format drift across Clerk / Twilio / DB. | Single shared E.164 normalizer (Phase 0.4) is the only formatting path. |
| MAU billing for backend-created users who never sign in. | Explicit Phase 0.2 verification against the Clerk plan before Phase 1 design is finalized. If they do bill, provisioning becomes lazier (defer create until first authed need). |
| Bilingual debt — shipping an EN-only SMS string. | All copy via `translation_keys` with ES parity; never edit `messages/*.json`. |

## Out of scope

- **Real resume parser.** Endpoints are stubbed; Phase 2 only makes resume honestly
  optional/non-blocking. The parser is a separate workstream.
- **Employer SMS onboarding wizard.** Employers onboard on the web.
- **On-demand SMS job search** beyond the Phase 3 `JOBS` digest (no free-text job
  query over SMS).
