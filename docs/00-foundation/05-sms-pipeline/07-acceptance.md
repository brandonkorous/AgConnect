# 05 — SMS Pipeline: Acceptance Criteria

## Functional

- [ ] `enqueueSms` is the only path to send SMS — direct Twilio calls anywhere else fail CI lint check.
- [ ] Every template has EN + ES variants and an explicit `vars` declaration.
- [ ] Locale selection uses `users.preferredLang`, not the locale of the request that triggered enqueue.
- [ ] Quiet-hours: SMS enqueued between 9 PM and 7 AM Pacific is held until 7:00 AM Pacific.
- [ ] Opt-out: a phone in `sms_opt_out` never receives any SMS, including transactional. The send is logged as `dropped`.
- [ ] STOP keyword received via inbound webhook → `sms_opt_out` row created within 2 seconds.
- [ ] Twilio status callback updates `sms_log.status` and `deliveredAt` / `failedAt` correctly.
- [ ] Twilio webhook signature failures return 401 and the row is not updated.
- [ ] `singletonKey` (jobKey) prevents duplicate sends — re-enqueueing the same key is a no-op.
- [ ] Failed sends retry 3× with backoff (30s, 5m, 30m). On exhaust, status = `failed_exhausted` and Sentry alert fires.

## Non-functional

- [ ] P50 send latency (enqueue → Twilio sent) < 2 seconds during business hours.
- [ ] P99 send latency < 30 seconds.
- [ ] Worker process throughput ≥ 100 sends/second per pod.
- [ ] No memory leak: 24h soak test maintains stable RSS.

## Compliance

- [ ] STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT all trigger opt-out (CTIA Short Code Monitoring guidelines).
- [ ] Welcome template includes "Reply STOP to opt out" / "Responde STOP para cancelar".
- [ ] A2P 10DLC campaign is registered and approved before launch.
- [ ] All templates declare a use case category (Customer Notifications, Account Notifications, etc.) for A2P registration.
- [ ] No PII in `sms_log.body` beyond the user's own first name (no SSN, work auth, etc.).

## Test scenarios

### Unit

1. `computeQuietHoursDefer` returns the next 7:00 AM PT for any time between 21:00 and 07:00 PT. Returns "now" otherwise.
2. Template renderer rejects missing required vars.
3. Twilio webhook signature validation: valid passes, tampered fails.

### Integration

1. **Quiet-hours defer:** enqueue at 22:30 PT → Twilio call happens at the next 07:00 PT (mocked clock).
2. **Opt-out drop:** insert `sms_opt_out` row, enqueue welcome → no Twilio call, `sms_log.status = 'dropped'`.
3. **Idempotency:** enqueue with the same `jobKey` twice → only one Twilio call, only one `sms_log` row.
4. **STOP handling:** POST signed inbound webhook with `Body=STOP` → `sms_opt_out` row created.
5. **Retry on transient failure:** Twilio returns 503 once, then succeeds → final status = `sent`, retry count visible in pg-boss.

### Manual

1. Send a real welcome SMS to a US 10DLC number; receive within 30s.
2. Send to a number that has texted STOP; verify no message arrives.
3. Send during quiet hours; verify it arrives at 7:00 AM PT.

## Definition of done

- A2P 10DLC campaign approved.
- All templates in [06-messaging.md](06-messaging.md) implemented and reviewed.
- Twilio Messaging Service configured with: Sender Pool, Inbound webhook, Status callback URL, default keyword auto-replies (STOP, HELP) enabled.
- pg-boss `send-sms` worker deployed as its own Kubernetes Deployment with HPA configured.
- Sentry alert configured: `sms.failed_exhausted` triggers PagerDuty.
- Admin runbook: how to bulk opt-out (e.g., emergency stop), how to inspect a delivery failure.
