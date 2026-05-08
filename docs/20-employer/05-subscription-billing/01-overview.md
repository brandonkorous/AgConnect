# 05 — Subscription Billing: Overview

## Purpose

Charge employers for paid plans via Stripe. Three tiers, all Stripe-backed:

- **Seed (`free` in DB)** — $0/mo. Up to 2 active postings. Applicant kanban, FLC verification badge, SEO-indexed public job board, worker skills wallet visibility, 90-day audit log. **In-app inbox only — no employer-triggered SMS to applicants** (that's a Field+ feature; cost falls to the paid tiers). Workers still receive platform-triggered SMS for new job alerts that match their saved searches, regardless of which employer's posting matched. Always free.
- **Field (`pro` in DB)** — Standard $199/mo or $1,990/yr (saves 2 months). Founder $99/mo or $990/yr for the first 50 paid accounts. Unlimited postings, worker search, **SMS to applicants from kanban actions** (received / interview / hired / rejected), crew & shift scheduling with SMS confirms, H-2A / MSPA / DOL compliance checklist, 7-year tamper-evident audit log, WIOA exports.
- **Farm (`enterprise` in DB)** — Standard $499/mo or $4,990/yr (saves 2 months). Founder $299/mo or $2,990/yr for the first 50 paid accounts. Everything in Field + multi-user accounts, branded grant exports + PIRL compliance, hire metrics dashboard, tenant-isolated participant data, dedicated success contact + SLA.

Workers and training organizations are always free — they never enter a payment flow. Billing applies only to employers (`role = 'employer'`).

The DB enum stays `free | pro | enterprise` for stability across migrations and existing code. The marketing names **Seed / Field / Farm** (EN) and **Semilla / Campo / Rancho** (ES) are presentation-only; resolved via `planBrandName(tier, locale)` in `@agconn/schemas`.

## Founder pricing

The first **50 paid accounts** across Field and Farm combined unlock founder pricing — roughly half off the standard price. Once the 50th paid subscription activates, standard pricing kicks in for all new checkouts. Existing founder subscribers stay locked to their original price ID for the life of the subscription, regardless of the counter.

How the counter works:

- **Source of truth** — live `SELECT COUNT(*)` over `employer_profiles WHERE plan != 'free' AND stripe_sub_id IS NOT NULL AND plan_status IN ('active','trialing','past_due')`. No dedicated counter table; the count is derived to avoid drift.
- **Public endpoint** — `GET /v1/landing/founder-slots` returns `{ remaining, total: 50, active }`. Cached on the edge for 30s. Drives the "X founder spots remaining" badge on the pricing page and landing pricing card.
- **Checkout-time resolution** — `POST /v1/employer/billing/checkout` recomputes the count server-side at the moment of checkout (no cache); if `remaining > 0`, the founder Stripe price ID is used; otherwise the standard price ID. The badge can be slightly stale; the picker cannot.
- **Cancellation** — if a founder cancels mid-flight, the slot returns to the pool. The cancelled customer cannot re-claim a founder slot at re-subscribe time unless `remaining > 0` again.

See [02-data-model.md](02-data-model.md) for the query and [03-api.md](03-api.md) for the endpoint contract.

## Stack

- **Stripe 22.1.0** — Checkout, Customer Portal, Webhooks
- **Stripe Subscriptions** — recurring billing
- **Stripe Tax** — California sales tax (already enabled on the account)
- **Stripe Customer Portal** — self-serve upgrade / downgrade / cancel
- **pg-boss** — webhook event processing

## Stripe products and prices

Created once via the Stripe Dashboard (or via Terraform/`stripe-cli`). Eight paid price IDs total — tier × interval × cohort:

```
STRIPE_PRICE_PRO_MONTHLY=price_...                 # Field standard
STRIPE_PRICE_PRO_YEARLY=price_...                  # Field standard
STRIPE_PRICE_PRO_FOUNDER_MONTHLY=price_...         # Field founder
STRIPE_PRICE_PRO_FOUNDER_YEARLY=price_...          # Field founder
STRIPE_PRICE_ENT_MONTHLY=price_...                 # Farm standard
STRIPE_PRICE_ENT_YEARLY=price_...                  # Farm standard
STRIPE_PRICE_ENT_FOUNDER_MONTHLY=price_...         # Farm founder
STRIPE_PRICE_ENT_FOUNDER_YEARLY=price_...          # Farm founder
```

Annual prices are exactly `monthly × 10` (2 months free, baked into the listed price — no separate coupon).

Stripe product names (for the dashboard):

| Product | Stripe product name |
|---------|-------------------|
| Seed (free) | `agconn_seed` |
| Field (pro) | `agconn_field` |
| Farm (enterprise) | `agconn_farm` |

## Flow summary

```
Employer hits "Upgrade" → server resolves cohort (founder vs standard) →
  Stripe Checkout (hosted, founder or standard price ID) → success
  ↓
Stripe webhook customer.subscription.created (carries the price ID actually charged)
  ↓
DB updates: employer_profiles.stripe_customer, stripe_sub_id, plan, plan_interval, price_cohort
  ↓
Employer notified via email
```

Subsequent management via Stripe Customer Portal.

## Scope

In scope:

- Stripe Checkout for new subscriptions (founder or standard price)
- Stripe Customer Portal for upgrade / downgrade / cancel
- Webhook handlers for: subscription.created, subscription.updated, subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
- Plan-tier enforcement throughout the platform
- Annual vs monthly billing
- Founder cohort counter and resolution
- Public `/v1/landing/founder-slots` endpoint for the pricing badge
- Dunning / grace period (Stripe-managed; we sync state)
- Per-employer billing log

Out of scope (MVP):

- One-time charges (e.g., featured posting)
- Coupons / promo codes (Stripe supports; we just don't surface)
- Manual founder-slot grants (admin override after the 50 are gone — handle via Stripe Dashboard if ever needed)
- Per-tenant Stripe accounts (Phase 2 — for white-label)
- Refunds via UI (admin-mediated only)

## Roles

- **Employer:** view current plan, change plan, manage billing.
- **Admin:** view all subscriptions, manually adjust plans (rare), issue refunds via Stripe Dashboard, view founder-slots counter.

## Success criteria

- Subscription state in DB stays in sync with Stripe (webhook lag P95 < 5s).
- Failed payments trigger graceful degradation (Stripe Smart Retries, then downgrade to Seed) with clear UX.
- Annual-billing math correct: annual price = monthly × 10 (2 months free).
- Founder counter never serves a founder price ID after slot 50 has been claimed.
- Public pricing page badge reflects the live count within 30 seconds.
- Admin can verify billing state for any employer in < 30 seconds.

## Dependencies

- [01-flc-verification](../01-flc-verification/) — billing post-verification only
- [02-job-postings](../02-job-postings/) — plan-tier limits enforced here
- [04-worker-search](../04-worker-search/) — Field+ gate
- [00-foundation/06-email-pipeline](../../00-foundation/06-email-pipeline/) — billing emails
- Stripe account, products + prices configured (eight paid price IDs)
