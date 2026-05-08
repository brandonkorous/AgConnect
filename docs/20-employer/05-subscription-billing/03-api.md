# 05 — Subscription Billing: API

## Public — landing

### GET /v1/landing/founder-slots

Public, unauthenticated. Drives the "X founder spots remaining" badge on the marketing pricing page and landing pricing card.

```ts
const FounderSlotsResponse = z.object({
  remaining: z.number().int().min(0),
  total:     z.number().int(),       // 50
  active:    z.boolean(),            // true when remaining > 0
});
```

Server logic:

```ts
const TOTAL = 50;
const used = await db.employerProfile.count({
  where: {
    plan: { not: 'free' },
    stripeSubId: { not: null },
    planStatus: { in: ['active', 'trialing', 'past_due'] },
  },
});
const remaining = Math.max(0, TOTAL - used);
return ok(c, { remaining, total: TOTAL, active: remaining > 0 });
```

Caching: edge cache for 30s (`Cache-Control: public, max-age=30, s-maxage=30`). The badge tolerates short staleness; the price-ID picker (below) does not and recomputes live.

Rate-limited like other public landing endpoints (60/min/IP).

## Employer-facing

### POST /v1/employer/billing/checkout

Create a Stripe Checkout Session for a new subscription.

```ts
const CheckoutBody = z.object({
  tier:     z.enum(['pro', 'enterprise']),
  interval: z.enum(['monthly', 'yearly']),
  locale:   z.enum(['en', 'es']).optional(),
}).strict();
```

Server logic:

1. Verify employer is FLC-verified (`flcVerifiedAt != null`).
2. Verify employer doesn't already have an active subscription (would use Customer Portal instead).
3. If `stripeCustomer` is null, create a Stripe Customer first; store ID.
4. **Resolve cohort live:** count active paid subscriptions; `cohort = (count < TOTAL_FOUNDER_SLOTS) ? 'founder' : 'standard'`.
5. Resolve `priceId` from env using `priceIdFor(tier, interval, cohort)`.
6. Create Checkout Session with `success_url` and `cancel_url`. Pass `cohort` in metadata so the webhook can dedupe state.
7. Return `{ url }`.

```ts
const cohort = await resolveFounderCohort(db);   // 'founder' | 'standard'
const priceId = priceIdFor(body.tier, body.interval, cohort);

const session = await stripe.checkout.sessions.create({
  customer: employer.stripeCustomer,
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${WEB_URL}/${locale}/employer/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url:  `${WEB_URL}/${locale}/employer/billing`,
  metadata:    { employerId: employer.id, tier: body.tier, interval: body.interval, cohort },
  automatic_tax: { enabled: true },             // Stripe Tax handles CA SaaS sales tax
  allow_promotion_codes: true,
});
return c.json({ url: session.url });
```

> Two checkouts initiated within the same second when only one slot remains will both see `remaining=1` and resolve `cohort='founder'`. Both Stripe Checkout sessions get the founder price ID. Stripe completes both subscriptions; the post-completion count reads 51. This is acceptable — the doc states "first 50 paying accounts" with the understanding that a small race at the boundary may admit one extra. If exactness ever matters, gate behind a Postgres advisory lock around the count + checkout creation.

### POST /v1/employer/billing/portal

Create a Customer Portal session.

Request body: `{ locale?: 'en' | 'es' }`.

Response: `{ url }`.

```ts
const portal = await stripe.billingPortal.sessions.create({
  customer: employer.stripeCustomer,
  return_url: `${WEB_URL}/${locale}/employer/billing`,
});
return c.json({ url: portal.url });
```

### GET /v1/employer/billing

Current billing state.

```ts
const BillingResponse = z.object({
  plan:              z.enum(['free', 'pro', 'enterprise']),
  interval:          z.enum(['monthly', 'yearly']).nullable(),
  currentPeriodEnd:  z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  features:          FeaturesSchema,
  hasPaymentMethod:  z.boolean(),
  stripeConfigured:  z.boolean(),
  priceCohort:       z.enum(['founder', 'standard']).nullable(),
});
```

### GET /v1/employer/billing/history

List of `billing_events` for the employer.

## Stripe webhook

### POST /webhooks/stripe

Unauthenticated; signature-verified.

```ts
stripeWebhookRouter.post('/', async (c) => {
  const sig = c.req.header('stripe-signature') ?? '';
  const body = await c.req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    throw new HTTPException(401, { message: 'invalid_signature' });
  }

  // Dedupe via stripe_event_id unique constraint
  const existing = await db.billingEvent.findUnique({ where: { stripeEventId: event.id } });
  if (existing) return c.text('OK');

  const evtRow = await db.billingEvent.create({
    data: { tenantId: '...', employerId: '...', eventType: event.type, stripeEventId: event.id, payload: event as any },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':       await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session); break;
      case 'customer.subscription.created':    await handleSubCreated(event.data.object as Stripe.Subscription); break;
      case 'customer.subscription.updated':    await handleSubUpdated(event.data.object as Stripe.Subscription); break;
      case 'customer.subscription.deleted':    await handleSubDeleted(event.data.object as Stripe.Subscription); break;
      case 'invoice.payment_succeeded':        await handlePaymentSucceeded(event.data.object as Stripe.Invoice); break;
      case 'invoice.payment_failed':           await handlePaymentFailed(event.data.object as Stripe.Invoice); break;
    }
    await db.billingEvent.update({ where: { id: evtRow.id }, data: { processedAt: new Date() } });
  } catch (err) {
    await db.billingEvent.update({ where: { id: evtRow.id }, data: { errorMsg: String(err) } });
    throw err;
  }
  return c.text('OK');
});
```

## Webhook handlers

### handleCheckoutCompleted

```ts
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const employerId = session.metadata?.employerId;
  if (!employerId) return;
  await db.employerProfile.update({
    where: { id: employerId },
    data: {
      stripeCustomer: session.customer as string,
      stripeSubId:    session.subscription as string,
    },
  });
  // Plan fields (including priceCohort) populated by customer.subscription.created shortly after.
}
```

### handleSubCreated / Updated

```ts
async function handleSubUpdated(sub: Stripe.Subscription) {
  const employer = await db.employerProfile.findFirst({ where: { stripeCustomer: sub.customer as string } });
  if (!employer) return;

  const priceId = sub.items.data[0].price.id;
  const tier     = priceIdToTier(priceId);       // pro | enterprise
  const interval = priceIdToInterval(priceId);   // monthly | yearly
  const cohort   = priceIdToCohort(priceId);     // founder | standard
  const isActive = ['active', 'trialing'].includes(sub.status);

  await db.employerProfile.update({
    where: { id: employer.id },
    data: {
      plan:                  isActive ? tier : 'free',
      planInterval:          isActive ? interval : null,
      planCurrentPeriodEnd:  new Date(sub.current_period_end * 1000),
      planCancelAtPeriodEnd: sub.cancel_at_period_end,
      priceCohort:           isActive ? cohort : null,
      planStatus:            sub.status,
    },
  });

  if (sub.status === 'active' && /* previous status was different */) {
    await enqueueEmail({ ..., template: 'billing.subscription_started', vars: { plan: tier, cohort } });
  }
}
```

`priceIdToCohort(priceId)` is added to `@agconn/schemas` alongside the existing `priceIdToTier` / `priceIdToInterval` helpers and reads the same env vars.

### handleSubDeleted

```ts
async function handleSubDeleted(sub: Stripe.Subscription) {
  const employer = await db.employerProfile.findFirst({ where: { stripeCustomer: sub.customer as string } });
  if (!employer) return;

  await db.employerProfile.update({
    where: { id: employer.id },
    data: {
      plan: 'free', planInterval: null, stripeSubId: null,
      planCurrentPeriodEnd: null, planCancelAtPeriodEnd: false,
      priceCohort: null, planStatus: 'canceled',
    },
  });

  await enqueueEmail({ ..., template: 'billing.subscription_canceled' });
}
```

When `planStatus` flips to `canceled`, the founder-slot counter naturally re-includes the freed slot on its next read. No counter-bookkeeping needed.

### handlePaymentFailed

```ts
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Stripe Smart Retries handle retry attempts.
  // We just notify the employer.
  const employer = await db.employerProfile.findFirst({ where: { stripeCustomer: invoice.customer as string } });
  if (!employer) return;
  await enqueueEmail({ ..., template: 'billing.payment_failed', vars: { amount: invoice.amount_due / 100 } });
}
```

### handlePaymentSucceeded

Send receipt email (Stripe also sends one; we send our branded one too).

```ts
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  await enqueueEmail({
    ...,
    template: 'billing.invoice_paid',
    vars: { amount: invoice.amount_paid / 100, hostedInvoiceUrl: invoice.hosted_invoice_url, pdfUrl: invoice.invoice_pdf },
  });
}
```

## Plan enforcement helper

```ts
// packages/schemas/src/plans.ts
export function canUseFeature(plan: EmployerPlanTier, feature: keyof Features): boolean {
  return PLAN_FEATURES[plan][feature] === true || PLAN_FEATURES[plan][feature] === Infinity;
}

export function activePostingLimit(plan: EmployerPlanTier): number {
  return PLAN_FEATURES[plan].activePostings;
}
```

Used in:

- Job-posting publish ([02-job-postings/03-api.md](../02-job-postings/03-api.md))
- Worker-search gate ([04-worker-search/03-api.md](../04-worker-search/03-api.md))

## Errors

| code | http | when |
|---|---|---|
| `not_verified` | 403 | checkout before FLC verification |
| `already_subscribed` | 409 | checkout while active subscription exists; redirect to portal |
| `stripe_unavailable` | 503 | Stripe not configured (no secret key, no price IDs for cohort) |
| `invalid_signature` | 401 | Stripe webhook signature failed |
| `webhook_replay` | 200 | duplicate event id |
