# 05 — Subscription Billing: Acceptance Criteria

## Functional

- [ ] Seed employer can hit `/billing/plans` → choose Field/Farm + Monthly/Yearly → Stripe Checkout opens.
- [ ] When `founder.remaining > 0`, checkout uses founder Stripe price IDs; when `remaining === 0`, checkout uses standard price IDs. Verified by reading the line-item price ID on the Checkout Session.
- [ ] Successful checkout flips DB `plan = 'pro' | 'enterprise'`, `planInterval`, and `priceCohort` correctly via webhook within 5s.
- [ ] Public `GET /v1/landing/founder-slots` returns `{ remaining, total: 50, active }` and is correct against the underlying count.
- [ ] Marketing pricing page renders the founder badge when `active === true` and hides it when `active === false`.
- [ ] Brand names render correctly in both locales (Seed/Field/Farm in EN; Semilla/Campo/Rancho in ES).
- [ ] Customer Portal accessible to active subscribers; allows update card, change plan, cancel.
- [ ] Webhook signature verification rejects tampered events (401).
- [ ] Webhook idempotency: duplicate event ID returns 200 without re-processing.
- [ ] Plan downgrade reflects in DB after Stripe webhook fires.
- [ ] On `subscription.deleted`, plan resets to `free`, `priceCohort` clears, `planStatus` flips to `canceled`; the slot is released for re-use.
- [ ] Existing active postings remain active when plan downgrades (no auto-close).
- [ ] New posting publish gated by current plan's `activePostings` limit, atomically (no overshoot).
- [ ] Worker search gate enforces `pro|enterprise`.
- [ ] **`applicantSms` gate enforces `pro|enterprise`** at the kanban-action enqueue site (not at the SMS worker). Seed kanban status changes write only an in-app inbox row; `services/api/src/employer/applications/*` consults `planFeatures(plan).applicantSms` before enqueuing. Verified by integration test: a Seed employer marking an applicant as hired produces an inbox row but no Twilio enqueue.
- [ ] Platform-triggered SMS to workers (saved-search job alerts, training reminders, account auth) fire correctly regardless of any employer's plan, since they're not tied to an employer subscription.
- [ ] Annual interval invoices include the appropriate discount (built into yearly price; `monthly × 10`).
- [ ] All four billing emails fire correctly per webhook event, with founder-pricing copy when applicable.

## Non-functional

- [ ] Stripe webhook handler P95 < 500ms.
- [ ] Webhook lag (Stripe event → DB update) P95 < 5s.
- [ ] Plan-feature enforcement adds < 1ms to gated endpoints (single object lookup).
- [ ] `GET /v1/landing/founder-slots` P95 < 50ms (single indexed COUNT + 30s edge cache).

## Compliance

- [ ] Stripe automatic Tax enabled for California SaaS sales tax compliance.
- [ ] Plain-language summary of charges before checkout, including which cohort the customer is on.
- [ ] Refund policy linked from billing page (out-of-scope for product copy; marketing).
- [ ] PCI: no card data ever touches our systems (Stripe-hosted Checkout + Portal).

## Test scenarios

### Unit

1. `priceIdToTier`, `priceIdToInterval`, `priceIdToCohort`: maps env price IDs correctly across all 8 paid prices.
2. `canUseFeature('free', 'workerSearch')` = false; `canUseFeature('pro', 'workerSearch')` = true.
3. `activePostingLimit('free')` = 2; `activePostingLimit('pro')` = Infinity.
4. `planBrandName('pro', 'en')` = 'Field'; `planBrandName('pro', 'es')` = 'Campo'.
5. Founder-slot resolver: `count = 49` → cohort = 'founder'; `count = 50` → cohort = 'standard'.

### Integration

1. **Founder checkout happy path:** with 0 paid subs, create checkout → Stripe Checkout uses `STRIPE_PRICE_PRO_FOUNDER_MONTHLY` → webhook `subscription.created` → DB `plan=pro, priceCohort=founder`.
2. **Standard checkout after exhaustion:** simulate 50 active paid subs → create checkout → Stripe Checkout uses `STRIPE_PRICE_PRO_MONTHLY` (standard) → DB `priceCohort=standard`.
3. **Founder cancellation frees slot:** with `count=50`, cancel one founder → `GET /v1/landing/founder-slots` returns `remaining=1, active=true`.
4. **Failed payment:** mock `invoice.payment_failed` → email enqueued; DB plan unchanged (Stripe retries).
5. **Cancellation at period end:** mock `subscription.updated` with `cancel_at_period_end = true` → DB `planCancelAtPeriodEnd = true`; slot remains claimed until period end.
6. **Final cancellation:** mock `subscription.deleted` → DB plan = free, priceCohort = null, planStatus = canceled; slot released.
7. **Webhook replay:** POST same event ID twice → second is no-op (returns 200).
8. **Cross-tenant employer:** webhook for employer in Tenant 2 doesn't touch Tenant 1 employer with same Stripe customer (impossible — `stripeCustomer` unique per employer).

### Manual / staging

1. Use Stripe test card 4242... → upgrade to Field Yearly → verify dashboard reflects within seconds and shows founder pricing tag.
2. Use 3D Secure card 4000 0027 6000 3184 → SCA challenge → completes successfully.
3. Use declined card 4000 0000 0000 0002 → checkout fails gracefully.
4. Open `/en/pricing` and `/es/pricing` → verify brand names render correctly and founder badge displays the live count.

## Definition of done

- All Stripe webhook events implemented + tested via stripe-cli `trigger`.
- Stripe Customer Portal configured: allow plan changes, payment-method updates, cancellation.
- All eight Stripe price IDs documented in env template; production prices created and locked.
- `GET /v1/landing/founder-slots` deployed and consumed by both marketing pricing surfaces.
- Sentry tags every billing event with `employerId`, `eventType`, and `priceCohort`.
- Admin runbook: how to inspect a billing dispute, refund process (via Stripe Dashboard), how to manually adjust a plan, how to read the founder-slots count.
