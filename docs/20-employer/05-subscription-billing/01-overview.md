# 05 — Subscription Billing: Overview

## Purpose

Charge employers for Pro and Enterprise plans via Stripe. Per kickoff §10:

- **Free** — $0/mo. Up to 2 active postings. Applicant review only (no worker search).
- **Pro** — $99/mo or $990/yr (2 months free). Unlimited postings. Worker search. Priority listing. Self-serve billing portal.
- **Enterprise** — $299/mo or $2,990/yr. Pro features + multi-user account, custom county coverage, dedicated grant reporting branding.

Workers and training orgs are always free. Billing applies only to employers (`role = 'employer'`).

## Stack

- **Stripe 22.1.0** — Checkout, Customer Portal, Webhooks
- **Stripe Subscriptions** — recurring billing
- **Stripe Customer Portal** — self-serve upgrade / downgrade / cancel
- **pg-boss** — webhook event processing

## Stripe products and prices

Created once via the Stripe Dashboard (or via Terraform/`stripe-cli`). Price IDs stored in env:

```
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ENT_MONTHLY=price_...
STRIPE_PRICE_ENT_YEARLY=price_...
```

Annual prices include a 2-month coupon equivalent (effective 16.7% discount built into the price, not a separate coupon).

## Flow summary

```
Employer hits "Upgrade" → Stripe Checkout (hosted) → success
  ↓
Stripe webhook customer.subscription.created
  ↓
DB updates: employer_profiles.stripe_customer, stripe_sub_id, plan
  ↓
Employer notified via email
```

Subsequent management via Stripe Customer Portal.

## Scope

In scope:

- Stripe Checkout for new subscriptions
- Stripe Customer Portal for upgrade/downgrade/cancel
- Webhook handlers for: subscription.created, subscription.updated, subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
- Plan-tier enforcement throughout the platform
- Annual vs monthly billing
- Dunning / grace period (Stripe-managed; we sync state)
- Per-employer billing log

Out of scope:

- One-time charges (e.g., featured posting)
- Coupons / promo codes (Stripe supports; we just don't surface)
- Tax handling beyond Stripe's automatic Tax (US sales tax)
- Per-tenant Stripe accounts (Phase 2 — for white-label)
- Refunds via UI (admin-mediated only)

## Roles

- **Employer:** view current plan, change plan, manage billing.
- **Admin:** view all subscriptions, manually adjust plans (rare), issue refunds via Stripe Dashboard.

## Success criteria

- Subscription state in DB stays in sync with Stripe (webhook lag P95 < 5s).
- Failed payments trigger graceful degradation (3-day grace, then downgrade to Free) with clear UX.
- Annual-billing math correct: annual price = monthly × 10 (2 months free).
- Admin can verify billing state for any employer in < 30 seconds.

## Dependencies

- [01-flc-verification](../01-flc-verification/) — billing post-verification only
- [02-job-postings](../02-job-postings/) — plan-tier limits enforced here
- [04-worker-search](../04-worker-search/) — Pro+ gate
- [00-foundation/06-email-pipeline](../../00-foundation/06-email-pipeline/) — billing emails
- Stripe account, products + prices configured
