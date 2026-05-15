# 05 — SMS Pipeline: Overview

## Purpose

A reliable, bilingual, opt-out-respecting SMS pipeline used for OTP confirmations (Clerk-managed), application/hire notifications, training reminders, and welcome messages. Twilio is the provider (kickoff §8.1 — Zoom SMS rejected for MVP).

## Architecture

```
event in API handler
  ↓
pg-boss enqueue { template, userId, vars }   ← idempotent job key
  ↓
worker process picks up job
  ↓
load user → resolve preferred_lang → load template → interpolate
  ↓
quiet-hours check (9 PM – 7 AM Pacific) → defer if needed
  ↓
opt-out check (sms_log.opted_out_at) → drop if opted out
  ↓
Twilio Messaging API send
  ↓
write sms_log row (status: queued)
  ↓
[async] Twilio webhook → update sms_log.status (delivered | failed)
```

## What this pipeline owns

- Sending SMS via Twilio's REST API
- Bilingual template rendering with variable interpolation
- Quiet-hours scheduling
- Opt-out (STOP) handling per US carrier rules
- Delivery status webhooks → `sms_log` updates
- Retry on transient failure (3× with backoff)
- Sentry alerting on hard failure

## What this pipeline does NOT own

- Clerk OTP delivery — Clerk owns that flow end-to-end (uses its own Twilio integration internally).
- Inbound replies — out of scope for MVP. STOP/HELP keywords handled by Twilio's automated keyword responses (Twilio Console config).
- Two-way messaging between worker ↔ employer — out of scope for MVP.

## Stack

- **Twilio 6.0.0** — Messaging API
- **pg-boss 12.18.1** — Postgres-backed job queue
- **Twilio Messaging Service SID** — handles sender pool, opt-out compliance, A2P 10DLC registration

## Provider configuration

- **A2P 10DLC registration** required for US SMS at scale. Register the AGCONN brand and a "Customer Notifications" campaign.
- **Messaging Service** with Sender Pool of 1+ short codes or 10DLC long codes.
- **Inbound webhook** points to `api.agconn.com/webhooks/twilio/inbound` (handles STOP).
- **Status callback** points to `api.agconn.com/webhooks/twilio/status` (handles delivery updates).

> **Inferred:** A2P 10DLC registration is mandatory and takes 1–4 weeks. This must start during Phase 0, not Phase 1, to avoid blocking SMS-dependent features. Track as a launch-blocker.

## Scope

In scope:

- Twilio wrapper in `packages/sms`
- pg-boss `send-sms` job + worker process
- Bilingual templates in `packages/sms/templates`
- `sms_log` audit table + Twilio webhook handlers
- Quiet-hours and opt-out logic
- Admin endpoint to view `sms_log` (out-of-scope for MVP UI; query directly)

Out of scope:

- Inbound message routing
- MMS
- WhatsApp Business API (post-MVP)
- Multi-provider failover (post-MVP)

## Success criteria

- 99% of SMS delivered within 30 seconds (excluding quiet-hours holds).
- 100% of opted-out users see no further marketing SMS (transactional SMS to opted-out users is a hard fail in CI).
- Zero SMS sent between 9 PM and 7 AM Pacific to a worker.
- All template renders are pre-validated against schema; runtime template errors fail loudly in Sentry.

## Dependencies

- [04-i18n](../04-i18n/) — `users.preferredLang` source of truth
- [03-database](../03-database/) — `sms_log` schema
- [10-infra-cicd](../10-infra-cicd/) — pg-boss worker deployment, Twilio secrets in Key Vault
