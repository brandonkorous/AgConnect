# 06 — Email Pipeline: Edge Cases & Risks

## Domain reputation damage

A burst of bounces or complaints destroys deliverability for weeks.

**Mitigations:**

- Use a dedicated subdomain (`mail.agconn.com`) so transactional reputation is isolated from any future marketing or admin email on `agconn.com`.
- Suppress on first complaint and after 3 soft bounces in 7 days.
- Rate-limit new sender warm-up: max 1000 sends/day for the first week, ramp up linearly.
- Monitor Postmaster Tools (Gmail) and SNDS (Microsoft) weekly during early launch.

## Resend outage

Resend's API is down or returns 5xx.

**Behavior:** pg-boss retries 3× with backoff. Sentry alert at exhaust. Messages can be re-enqueued manually after recovery. No multi-provider failover in MVP.

## Clerk magic-link path

Clerk uses Resend internally for magic-link delivery (configured in Clerk Dashboard, not by us). Clerk's emails do NOT go through our pipeline:

- They don't appear in `email_log`.
- They use Clerk's templates (which Clerk allows customizing and localizing).
- They use Clerk's domain reputation, not ours, unless we configure Clerk to send from our domain.

> **Inferred:** Configure Clerk to send magic-link emails from `noreply@mail.agconn.com` so the user sees a consistent sender. This requires DNS verification of the subdomain in Clerk too. Plan for it; not strictly required for MVP launch.

## Subject line localization

Subject lines are interpolated server-side from `email.<name>.subject` keys. If the key is missing in one locale, the renderer falls back to EN.

**Mitigation:** `check-i18n-parity` covers `email.*.subject` keys. Test renders both locales for every template.

## Attachment size limits

Resend supports attachments up to 40 MB total. Certificate PDFs (~ 100 KB) and grant report XLSX (~ 1 MB) are far below.

**Risk:** future bulk training reports could grow. Add a guard that rejects > 20 MB at enqueue time and switches to a download link.

## Unsubscribe vs. transactional

Some emails are "transactional" (account creation, password reset) and exempt from unsubscribe under CAN-SPAM. AGCONN's transactional sends include: hire confirmations, billing receipts, certificate delivery.

> **Inferred:** Even though some emails are arguably transactional, we honor unsubscribe on ALL emails. Reason: simplest mental model for users, and the cost of accidentally sending to an unsubscribed user is high. Marketing-style emails (job alerts, training recommendations) are absolutely opt-out-able.

## Internationalization in inbox

Some email clients render UTF-8 subject lines incorrectly. RFC 2047 encoding is needed for non-ASCII subjects.

**Mitigation:** Resend handles RFC 2047 encoding automatically. Spot-check Spanish subjects in real inbox tests.

## Spam-trigger words

Banking/marketing spam triggers: "free", "guarantee", "act now", "limited time". AGCONN avoids these in transactional copy.

**Mitigation:** review templates against a spam-checker (e.g., Mail-Tester) before launch. Adjust copy as needed.

## Bounce types

- **Hard bounce** (mailbox doesn't exist) → immediate suppression.
- **Soft bounce** (mailbox full, server error) → no immediate suppression; suppress after 3 soft bounces within 7 days.
- **Complaint** (user marked as spam) → immediate suppression.
- **Block** (IP/domain blocked by recipient) → log for monitoring; may indicate reputation damage.

## Locale switch mid-flow

Same as SMS: emails use `users.preferredLang` at the moment the worker picks up the job, not the locale of the request that enqueued it. See [05-sms-pipeline/08-edge-cases.md](../05-sms-pipeline/08-edge-cases.md).

## Privacy: email content in logs

`email_log.subject` and the React Email render output contain user-facing copy that may include the user's first name and partial details. PII handling:

- Only admins and the user themselves can read their own `email_log` rows (RLS).
- Sentry breadcrumbs scrub `vars` and `subject` before reporting.
- Retention 13 months → archive → hard delete.

## Open questions

1. Multi-provider failover — which secondary provider? Postmark and SendGrid are common choices. Defer.
2. Marketing emails (job alert digest, training recommendations) — when do they come into scope, and should they live in this pipeline or a separate `marketing-email` pipeline? Separate pipeline likely better for compliance segregation.
3. Configurable per-tenant sender domain — necessary for white-label tenants. Out of scope for MVP.
