# 06 — Email Pipeline: Overview

## Purpose

A bilingual transactional email pipeline used for employer magic-link auth (delivered via Clerk's Resend integration), application notifications, hire confirmations, certificate delivery, billing receipts, and grant report email delivery. Resend is the provider (kickoff §8.2).

## Architecture

```
event in API handler
  ↓
pg-boss enqueue { template, userId/employerId, vars }
  ↓
worker picks up job → resolves preferredLang → renders React Email
  ↓
opt-out check (email_log.unsubscribed_at) → drop if opted out
  ↓
Resend API send → store providerId
  ↓
[async] Resend webhook → update email_log status (delivered | bounced | complained)
```

## What this pipeline owns

- Sending transactional emails via Resend
- React Email template rendering with locale prop
- One-click unsubscribe (CAN-SPAM compliance)
- Bounce / complaint handling → suppression
- Resend webhook → `email_log` updates

## What this pipeline does NOT own

- Magic-link emails for auth — Clerk handles, configured to use Resend integration in Clerk Dashboard.
- Marketing emails — out of scope for MVP.
- Inbound email parsing — out of scope.

## Stack

- **Resend 6.12.2** — REST API
- **React Email** — `@react-email/components` for templates
- **pg-boss 12.18.1** — queue
- Verified sending domain `agconn.com` with SPF, DKIM, DMARC records.

> **Inferred:** Use a dedicated subdomain (`mail.agconn.com`) for sending so a deliverability incident on transactional mail doesn't taint the main domain reputation. SPF/DKIM/DMARC set on `mail.agconn.com`.

## Scope

In scope:

- Resend wrapper in `packages/email`
- React Email templates in `packages/email/src/templates`
- pg-boss `send-email` job + worker
- `email_log` audit + suppression handling
- Resend webhook for delivery status
- Unsubscribe page + token

Out of scope:

- Marketing emails / drip campaigns
- Email A/B testing
- Inbound email handling
- Multi-provider failover (post-MVP)

## Success criteria

- 99% of transactional emails delivered to inbox (not spam) for verified domains.
- All emails render correctly in Gmail, Outlook (web + desktop), Apple Mail (iOS + macOS), and a Spanish-locale Gmail.
- One-click unsubscribe works without authentication and is honored within 1 second.
- Bounced or complained emails immediately suppress further sends to that address.

## Dependencies

- [04-i18n](../04-i18n/) — preferredLang source
- [02-auth](../02-auth/) — Clerk uses Resend for magic links (configured in Clerk Dashboard, not by us)
- [03-database](../03-database/) — `email_log` table
