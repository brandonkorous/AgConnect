# 06 — Email Pipeline: Acceptance Criteria

## Functional

- [ ] `enqueueEmail` is the only path to send transactional email; direct Resend calls anywhere else fail CI lint check.
- [ ] Every template has EN + ES variants with matching var names.
- [ ] Locale selection uses `users.preferredLang` unless explicitly overridden.
- [ ] Suppressed addresses (`email_suppression`) are never sent to; the send is logged as `dropped`.
- [ ] Hard bounce → automatic suppression entry; no further sends to that address.
- [ ] Spam complaint → automatic suppression entry.
- [ ] One-click unsubscribe (RFC 8058) works without authentication and adds suppression within 1 second.
- [ ] `List-Unsubscribe` and `List-Unsubscribe-Post` headers present on every send.
- [ ] Resend webhook signature failures return 401 and the row is not updated.
- [ ] `singletonKey` (jobKey) prevents duplicate sends.

## Non-functional

- [ ] P50 send latency (enqueue → Resend sent) < 2 seconds.
- [ ] P99 < 30 seconds.
- [ ] All templates render correctly (visual diff in CI) in: Gmail Web, Gmail iOS, Outlook Web, Outlook for Windows, Apple Mail iOS, Apple Mail macOS.
- [ ] Inbox placement (not spam) ≥ 95% on a representative test (Gmail, Yahoo, Outlook accounts) for the first 30 days post-launch.

## Compliance

- [ ] Sending domain has SPF, DKIM, DMARC records (TXT) verified.
- [ ] DMARC policy: `p=quarantine` minimum, with `rua` reporting to a monitored mailbox.
- [ ] Every email has a working unsubscribe link (CAN-SPAM § 5(a)(3)).
- [ ] Physical mailing address present in every email footer (CAN-SPAM § 5(a)(5)).
- [ ] No misleading subject line or sender name (CAN-SPAM § 5(a)(1) and § 5(a)(2)).
- [ ] Unsubscribe honored within 10 business days (we honor in seconds).

## Test scenarios

### Unit

1. `verifyResendSignature` accepts valid signatures; rejects tampered.
2. `makeUnsubscribeToken` and `verifyUnsubscribeToken` round-trip; expired tokens reject.
3. Template renderer outputs both HTML and text variants; both contain the unsubscribe link.

### Integration

1. **Suppression enforcement:** insert `email_suppression`, enqueue → no Resend call, `email_log.status = 'dropped'`.
2. **Hard bounce → suppression:** POST signed Resend webhook event `email.bounced` with `bounce_type: hard` → `email_suppression` row exists.
3. **Complaint → suppression:** POST signed `email.complained` → `email_suppression` row exists.
4. **One-click unsubscribe:** POST `/unsubscribe?t={token}` → `email_suppression` row created.
5. **Unsubscribe undo (within 24h):** GET `/unsubscribe?t={token}&action=undo` → suppression deleted.

### Manual

1. Trigger every template in EN and ES via dev preview; visually verify rendering across the listed clients.
2. Send a real magic-link via Clerk (configured to use Resend) to a Gmail and Outlook address; verify inbox placement.
3. Bounce test: send to a known invalid address (e.g., `bounce@simulator.amazonses.com` if applicable, or Resend's bounce sandbox); verify suppression triggers.

## Definition of done

- Verified sending domain in Resend (`mail.agconn.com`).
- DNS records (SPF, DKIM, DMARC) committed to infra repo and deployed.
- Resend webhook secret stored in Azure Key Vault.
- Email preview UI accessible via `pnpm --filter email preview`.
- Sentry alert on `email.failed_exhausted` rate > 1/hour.
- Admin runbook: how to view a user's email log, how to manually suppress, how to lift a suppression after support ticket.
