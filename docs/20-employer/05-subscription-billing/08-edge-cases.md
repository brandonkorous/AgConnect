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
- The founder-slot count is derived from DB state, so a missed webhook briefly drifts the count. The reconciler restores correctness on next run.

## Founder-slot race at the boundary

Two checkouts initiated within the same second when only one slot remains will both see `remaining=1` and be issued the founder price ID. After both `subscription.created` webhooks land, the count reads 51.

**Decision:** acceptable. The "first 50 paying accounts" promise tolerates a small admit-by-one race at the boundary. Business cost: at most a handful of extra founders. Engineering cost of preventing it (Postgres advisory lock around count + checkout creation) outweighs the value.

If exactness ever matters, gate the resolver in `POST /billing/checkout` behind `pg_advisory_xact_lock(hashtext('founder_slots'))` — the lock is held only for the duration of the count + Stripe API call.

## Plan / interval price ID changes

Marketing changes Field standard from $199 to $189. New price ID created in Stripe.

**Mitigation:**

- New price ID added to env (e.g., `STRIPE_PRICE_PRO_MONTHLY_V2`).
- New checkouts use new price.
- Existing subscriptions remain on old price (Stripe doesn't auto-migrate).
- `priceIdToTier` / `priceIdToInterval` / `priceIdToCohort` need to recognize legacy IDs — extend the env-key search to include `_V2` suffix.
- Migration to new pricing requires a separate effort (notify customers, prorated change). Out of scope for MVP code; document the playbook.

## Founder pricing has ended

Once `count >= 50`, the resolver returns `cohort = 'standard'` for all new checkouts.

**Behavior:**

- Existing founder subscribers stay on their original founder price ID per Stripe semantics. Their renewals charge $99/$299, not $199/$499.
- Marketing badge swaps from "X founder spots remaining" to "Founder pricing has ended — standard pricing applies."
- If the marketing copy needs to be archived (e.g., for FTC clarity once the cohort closes), keep the page as-is and rely on the badge state.

## Customer Portal change to old price

Employer in portal might be able to switch to legacy price options.

**Mitigation:** Stripe Customer Portal config restricts which prices are user-changeable. Configure carefully:

- Founder customers may switch tiers (Field → Farm) but stay on the founder cohort if they were originally founder. Achieve this by exposing only founder price IDs in the portal for customers whose current `priceCohort = 'founder'`.
- Standard customers see only standard price IDs.
- Cohort upgrades (standard → founder) are not permitted via portal — that would let standard customers downgrade their price.

## Card expiry

Card expires; payment fails; Stripe Smart Retries kick in.

**Behavior:**

- Stripe sends customer email about expiring card 60 days before.
- We rely on Stripe's email + send our own `billing.payment_failed` if a charge fails.
- A founder whose subscription cancels because of card expiry releases their slot. If they re-subscribe later and `remaining > 0`, they can claim a new founder slot.

## Canceled then re-subscribed

Employer cancels, then re-subscribes 30 days later.

**Behavior:**

- Cancellation: subscription.deleted → plan = free, priceCohort = null, planStatus = canceled. Slot released.
- Re-subscribe: new checkout → cohort resolved fresh from current count → new subscription → new sub_id. Old `stripeSubId` overwritten.
- No data lost; their employer profile and postings persisted through Free state.

## Multi-employer with same Stripe customer

Possible if email is reused. Stripe customer linked uniquely to one employer in our DB (`stripeCustomer` unique constraint).

**Mitigation:** create a new Stripe customer per employer onboarding. Don't reuse customers across employer profiles.

## Refunds

Stripe Dashboard handles refunds; we sync via `charge.refunded` webhook.

**Decision:** for MVP, refunds are admin-mediated only (via Stripe Dashboard), not self-serve. Worker complaints route to support → admin issues refund in Stripe → webhook updates billing log → admin emails the customer (canned response).

## Tax handling

Stripe automatic Tax handles California SaaS sales tax. Account-level Stripe Tax is already enabled.

**Behavior:** Employer enters address in Checkout; Stripe calculates and collects.

## Dispute / chargeback

Employer disputes a charge.

**Behavior:**

- Stripe holds the funds; sends `charge.dispute.created` webhook.
- Admin reviews via Stripe Dashboard, submits evidence.
- If dispute lost, funds withdrawn; we may want to disable Field/Farm features during a dispute (out of scope for MVP — admin manual adjustment).

## Concurrent plan changes

Employer in two tabs: one initiates upgrade, the other cancel. Race condition.

**Mitigation:**

- Stripe is the source of truth; whatever the final state is, our DB syncs to it via the last `subscription.updated` event.
- UI may briefly show stale state; on reload, current state reflects.

## Free → Field mid-cycle features

Employer upgrades mid-cycle. Worker search instantly available, even though Stripe's first-day prorated charge is small.

**Behavior:** correct. Plan flag flips immediately on `subscription.created`, regardless of charge amount.

## Field → Free mid-cycle

Employer cancels with `cancel_at_period_end = true`. They keep Field until period end.

**Behavior:** UI banner shows cancellation date; features remain active. Slot stays claimed until end_date and `subscription.deleted` fires.

If they cancel immediately (`cancel_at_period_end = false`): plan = free immediately, slot released, prorated refund issued by Stripe.

## Stripe outage

Stripe API down; checkout fails.

**Behavior:** Stripe API has 99.99% uptime; rare. UI shows friendly error; employer retries later.

## Bank account vs card

Stripe supports ACH for large invoices (Farm).

**Decision:** support both via Stripe Checkout (it offers them as payment methods if enabled in account settings). No code changes needed.

## Refund audit trail

`billing_events` captures all webhook events including refunds. Admin can export for accounting.

## SMS cost leak from Seed (gate placement)

The `applicantSms` gate must live at the **enqueue site** in `services/api/src/employer/applications/*` — not in `services/sms-worker`. If the gate lived only in the worker, every Seed kanban action would still create a queued job that the worker then drops, which is wasteful and (more importantly) leaves a trail of "almost-sent" SMS in the queue that's easy to misroute later.

**Decision:** before any kanban action (POST /v1/employer/applications/{id}/transition or equivalent) calls into the messaging hand-off, it MUST check `planFeatures(employer.plan).applicantSms`. If false, the handler writes the in-app inbox row and returns; no Twilio job is enqueued. The SMS worker stays plan-agnostic and the gate is unambiguous.

**Failure mode if missed:** a Seed employer with two postings could rack up tens of dollars of Twilio cost per month — small per-account, but it's free margin leaking from the worst-economics tier. Catch it in code review by grep'ing for `enqueueApplicantSms` (or whatever the helper ends up named) and confirming each call site is preceded by the plan check.

## Open questions

1. Custom counties for Farm — how does admin grant per-tenant county access? Out of scope for MVP; design when first Farm customer signs.
2. Multi-user Farm account — Phase 2 with Clerk Organizations.
3. Promo codes / coupons — Stripe supports; surface in UI when marketing asks.
4. Annual cancellation refund policy — full refund, prorated, or no refund? Confirm with finance/legal before launch.
5. Should the founder counter be displayed publicly when `remaining < 5`? Risks scarcity-marketing tone vs. the dignified Tierra brand. Default: yes, display the count whenever active. Revisit if it reads as urgency theater in user testing.
