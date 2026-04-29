# 05 — Subscription Billing: Acceptance Criteria

## Functional

- [ ] Free employer can hit /billing/plans → choose Pro/Enterprise + Monthly/Yearly → Stripe Checkout opens.
- [ ] Successful checkout flips DB `plan = 'pro' | 'enterprise'` and `planInterval` correctly via webhook within 5s.
- [ ] Customer Portal accessible to active subscribers; allows update card, change plan, cancel.
- [ ] Webhook signature verification rejects tampered events (401).
- [ ] Webhook idempotency: duplicate event ID returns 200 without re-processing.
- [ ] Plan downgrade reflects in DB after Stripe webhook fires.
- [ ] On `subscription.deleted`, plan resets to `free`; Pro features blocked thereafter.
- [ ] Existing active postings remain active when plan downgrades (no auto-close).
- [ ] New posting publish gated by current plan's `activePostings` limit, atomically (no overshoot).
- [ ] Worker search gate enforces `pro|enterprise`.
- [ ] Annual interval invoices include the appropriate discount (built into yearly price).
- [ ] All four billing emails fire correctly per webhook event.

## Non-functional

- [ ] Stripe webhook handler P95 < 500ms.
- [ ] Webhook lag (Stripe event → DB update) P95 < 5s.
- [ ] Plan-feature enforcement adds < 1ms to gated endpoints (single object lookup).

## Compliance

- [ ] Stripe automatic Tax enabled for US sales tax compliance.
- [ ] Plain-language summary of charges before checkout.
- [ ] Refund policy linked from billing page (out-of-scope for product copy; marketing).
- [ ] PCI: no card data ever touches our systems (Stripe-hosted Checkout + Portal).

## Test scenarios

### Unit

1. `priceIdToTier`, `priceIdToInterval`: maps env price IDs correctly.
2. `canUseFeature('free', 'workerSearch')` = false; `canUseFeature('pro', 'workerSearch')` = true.
3. `activePostingLimit('free')` = 2; `activePostingLimit('pro')` = Infinity.

### Integration

1. **Checkout happy path:** create checkout session → mock Stripe webhook `subscription.created` → DB plan = pro.
2. **Failed payment:** mock `invoice.payment_failed` → email enqueued; DB plan unchanged (Stripe retries).
3. **Cancellation at period end:** mock `subscription.updated` with `cancel_at_period_end = true` → DB `planCancelAtPeriodEnd = true`.
4. **Final cancellation:** mock `subscription.deleted` → DB plan = free.
5. **Webhook replay:** POST same event ID twice → second is no-op (returns 200).
6. **Cross-tenant employer:** webhook for employer in Tenant 2 doesn't touch Tenant 1 employer with same Stripe customer (impossible — `stripeCustomer` unique per employer).

### Manual / staging

1. Use Stripe test card 4242... → upgrade to Pro Yearly → verify dashboard reflects within seconds.
2. Use 3D Secure card 4000 0027 6000 3184 → SCA challenge → completes successfully.
3. Use declined card 4000 0000 0000 0002 → checkout fails gracefully.

## Definition of done

- All Stripe webhook events implemented + tested via stripe-cli `trigger`.
- Stripe Customer Portal configured: allow plan changes, payment-method updates, cancellation.
- Stripe price IDs documented in env template; production prices created and locked.
- Sentry tags every billing event with `employerId` and `eventType`.
- Admin runbook: how to inspect a billing dispute, refund process (via Stripe Dashboard), how to manually adjust a plan.
