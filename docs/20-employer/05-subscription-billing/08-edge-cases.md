# 05 — Subscription Billing: Edge Cases & Risks

## Webhook out-of-order delivery

Stripe webhooks can arrive out of order (`subscription.updated` before `subscription.created`).

**Mitigation:**

- All handlers are idempotent — they update to the current desired state regardless of prior state.
- Use `subscription.id` to look up the latest state in Stripe if uncertain (`stripe.subscriptions.retrieve(id)`).
- Store `stripe_event_id` for dedupe AND `event.created` timestamp; reject events older than the last applied for the same subscription.

## Webhook lost

Stripe retries 3 days. After 72h, the event is dropped.

**Mitigation:**

- Stripe Dashboard alert on event delivery failure rate.
- Manual reconciliation script: `pnpm billing:reconcile` queries Stripe for all subscriptions and ensures DB matches. Out of scope for MVP — add when first issue surfaces.

## Plan / interval price ID changes

Marketing changes Pro from $99 to $89. New price ID created in Stripe.

**Mitigation:**

- New price ID added to env (`STRIPE_PRICE_PRO_MONTHLY_V2`).
- New checkouts use new price.
- Existing subscriptions remain on old price (Stripe doesn't auto-migrate).
- Migration to new pricing requires a separate effort (notify customers, prorated change). Out of scope for MVP code; document the playbook.

## Customer Portal change to old price

Employer in portal might be able to switch to legacy price options.

**Mitigation:** Stripe Customer Portal config restricts which prices are user-changeable. Set this carefully.

## Card expiry

Card expires; payment fails; Stripe Smart Retries kick in.

**Behavior:**

- Stripe sends customer email about expiring card 60 days before.
- We rely on Stripe's email + send our own `billing.payment_failed` if a charge fails.

## Canceled then re-subscribed

Employer cancels, then re-subscribes 30 days later.

**Behavior:**

- Cancellation: subscription.deleted → plan = free.
- Re-subscribe: new checkout → new subscription → new sub_id. Old `stripeSubId` overwritten.
- No data lost; their employer profile and postings persisted through Free state.

## Multi-employer with same Stripe customer

Possible if email is reused. Stripe customer linked uniquely to one employer in our DB (`stripeCustomer` unique constraint).

**Mitigation:** create a new Stripe customer per employer onboarding. Don't reuse customers across employer profiles.

## Refunds

Stripe Dashboard handles refunds; we sync via `charge.refunded` webhook.

**Decision:** for MVP, refunds are admin-mediated only (via Stripe Dashboard), not self-serve. Worker complaints route to support → admin issues refund in Stripe → webhook updates billing log → admin emails the customer (canned response).

## Tax handling

Stripe automatic Tax handles US sales tax. For Central Valley, services are typically not sales-taxable, but Stripe checks per-jurisdiction.

**Mitigation:** Stripe automatic Tax enabled. Employer enters their address in Checkout; Stripe calculates.

## Dispute / chargeback

Employer disputes a charge.

**Behavior:**

- Stripe holds the funds; sends `charge.dispute.created` webhook.
- Admin reviews via Stripe Dashboard, submits evidence.
- If dispute lost, funds withdrawn; we may want to disable Pro features during a dispute (out of scope for MVP — admin manual adjustment).

## Concurrent plan changes

Employer in two tabs: one initiates upgrade, the other cancel. Race condition.

**Mitigation:**

- Stripe is the source of truth; whatever the final state is, our DB syncs to it via the last `subscription.updated` event.
- UI may briefly show stale state; on reload, current state reflects.

## Free → Pro mid-cycle features

Employer upgrades mid-cycle. Worker search instantly available, even though Stripe's first-day prorated charge is small.

**Behavior:** correct. Plan flag flips immediately on `subscription.created`, regardless of charge amount.

## Pro → Free mid-cycle

Employer cancels with `cancel_at_period_end = true`. They keep Pro until period end.

**Behavior:** UI banner shows cancellation date; features remain active.

If they cancel immediately (`cancel_at_period_end = false`): plan = free immediately, prorated refund issued by Stripe.

## Stripe outage

Stripe API down; checkout fails.

**Behavior:** Stripe API has 99.99% uptime; rare. UI shows friendly error; employer retries later.

## Bank account vs card

Stripe supports ACH for large invoices (Enterprise).

**Decision:** support both via Stripe Checkout (it offers them as payment methods if enabled in account settings). No code changes needed.

## Refund audit trail

`billing_events` captures all webhook events including refunds. Admin can export for accounting.

## Open questions

1. Custom counties for Enterprise — how does admin grant per-tenant county access? Out of scope for MVP; design when first Enterprise customer signs.
2. Multi-user Enterprise account — Phase 2 with Clerk Organizations.
3. Promo codes / coupons — Stripe supports; surface in UI when marketing asks.
4. Annual cancellation refund policy — full refund, prorated, or no refund? Confirm with finance/legal before launch.
5. Stripe Tax — verify with CA tax compliance whether AgConn's service tier is taxable. Likely not, but worth confirming.
