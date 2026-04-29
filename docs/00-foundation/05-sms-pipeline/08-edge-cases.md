# 05 — SMS Pipeline: Edge Cases & Risks

## A2P 10DLC delays

Carrier registration approval takes 1–4 weeks. Without it, US carriers may filter or rate-limit messages.

**Mitigation:** start registration during Phase 0 of the build. Until approved, run on a Twilio short code (faster but expensive) or accept some throughput limits in dev/staging. Production launch is gated on approval.

## Twilio outage

Twilio's REST API is down or returns 5xx for an extended window.

**Behavior:** pg-boss retries 3× with backoff. On exhaust, the job is marked `failed`, Sentry alerts. Messages are not lost — re-enqueue manually after recovery via admin tool.

> **Inferred:** Multi-provider failover (Twilio → MessageBird) is post-MVP. For MVP, accept Twilio as a single point of failure and rely on Twilio's own redundancy.

## Phone formatting

Phones must be E.164 (`+15555551234`). Invalid formats cause silent failures or cross-region misroutes.

**Mitigation:**

- Clerk normalizes phone to E.164 on creation.
- `users.phone` validated against `/^\+1\d{10}$/` (US-only for MVP).
- E2E test uses Twilio test credentials and a magic test number.

## Welcome SMS on slow Twilio queue

User completes onboarding → expects welcome SMS in seconds → Twilio is slow → user thinks something is broken.

**Mitigation:**

- UI shows "Welcome SMS will arrive shortly" rather than "...has been sent".
- Don't depend on the SMS for any unblocking step in MVP — every UI flow continues without the SMS.

## Rate limits

Twilio allows ~1 message per second per long-code by default. With multiple long codes in a Messaging Service, throughput multiplies.

**Risk:** sending 10k job alerts at once exceeds rate limit, queue backs up, latency spikes.

**Mitigation:**

- Use Twilio Messaging Service with a sender pool.
- pg-boss `teamSize` set to match Twilio rate limit (configurable).
- Bulk job alerts batch over time (out of scope for MVP — premature optimization).

## Carrier filtering

US carriers (especially T-Mobile / Sprint) filter messages they consider spam: shortened URLs, certain keywords ("free", "click here"), or unverified senders.

**Mitigation:**

- Use full domain URLs (`agconn.com`) not bit.ly.
- Avoid spam-trigger words.
- A2P 10DLC registration significantly reduces filtering.
- Monitor `sms_log.errorCode` for `30001-30007` (carrier rejection codes); investigate.

## Time-zone correctness

Quiet hours computed from server time can drift if server tz is wrong.

**Mitigation:** use `luxon` with explicit `America/Los_Angeles` zone in `computeQuietHoursDefer`. Server tz is irrelevant. Test cases include sends from servers in UTC and from servers in PT to confirm same result.

## DST transitions

Pacific Time observes DST. The "9 PM Pacific" cutoff shifts in real UTC terms.

**Mitigation:** `luxon` handles DST natively; no special-case code. Test cases at the spring-forward and fall-back DST boundaries verify behavior.

## Template length blowout

Variable expansion can push a 140-char template past 160 chars, forcing multi-segment send.

**Mitigation:**

- Build-time check warns if template is over 140 chars (allows 20 chars for vars).
- Truncate `{firstName}` to 20 chars in the template renderer to bound expansion.

## Lost Twilio status callbacks

Twilio retries status callbacks on 5xx but eventually gives up.

**Behavior:** `sms_log.status` may stay at `sent` instead of progressing to `delivered`. This is acceptable — `sent` means Twilio accepted the message. `delivered` is informational.

**Mitigation:** Sentry alert if > 5% of `sent` rows lack a `delivered` or `failed` update within 24h.

## Privacy: SMS body in logs

`sms_log.body` is the rendered message, which may include the user's first name. This is PII.

**Mitigation:**

- `sms_log` access is restricted by RLS to the user's own and admin.
- Sentry breadcrumbs scrub `body` before reporting.
- Log retention 13 months, then archived/deleted.

## Locale switch mid-flow

User completes onboarding in ES, switches to EN, applies for a job. The application-applied SMS — should it be EN or ES?

**Decision:** ES. The trigger uses `users.preferredLang` at the moment the SMS worker picks up the job. `users.preferredLang` is updated only via explicit toggle. The web app's transient locale switch (URL prefix) does not change the user's preferred lang unless they're authenticated and toggled it.

> **Inferred:** This is the safer default — workers' SMS arrives in the language they explicitly chose. If users want the SMS to follow the URL/session locale, expose a "remember this locale for SMS too" prompt at toggle time. Out of scope for MVP.

## Worker process restart mid-send

If the pg-boss worker crashes after Twilio accepts the message but before `sms_log` update, we have a Twilio send with no log row — orphan.

**Mitigation:**

- Create the `sms_log` row BEFORE calling Twilio (status `sending`). Update with `providerSid` after Twilio responds.
- If the worker crashes, the row stays at `sending`. A reconciliation job (post-MVP) re-checks Twilio for matching messages.
- For MVP, accept the rare orphan row.

## Open questions

1. Provider failover — when do we add MessageBird or AWS SNS as a backup? Probably after Phase 5.
2. Scheduled bulk alerts (e.g., job alert digest at 8 AM) — how do we throttle across thousands of users? Out of scope for MVP; design before launching saved-search alerts.
3. Inbound replies beyond STOP — when do workers expect to text back? If/when we add two-way messaging, the inbound handler grows substantially. Out of scope for MVP.
