import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import {
  CheckoutBody,
  PortalBody,
  hasPriceId,
  planFeatures,
  priceIdFor,
} from '@agconn/schemas';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';
import { isVerified } from '../shared';
import { getStripe, webUrl } from './stripe';
import { resolveCheckoutCohort } from './founder-slots';

// audit-required:exempt — checkout creates a Stripe customer + updates the
// employer profile. The state-of-record audit row lands in billing_events
// when Stripe sends the corresponding webhook (handled in webhooks/stripe.ts
// with emitSystemAudit billing.subscription.created). Logging here would
// double-count.

export const employerBillingRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerBillingRoutes.use('*', requireAuth('employer'));
employerBillingRoutes.use('*', requireRole('employer'));
employerBillingRoutes.use('*', requireTenant);

employerBillingRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  const features = planFeatures(profile.plan);
  const stripe = getStripe();

  return ok(c, {
    plan: profile.plan,
    interval: profile.planInterval,
    currentPeriodEnd: profile.planCurrentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: profile.planCancelAtPeriodEnd,
    features: {
      activePostings: Number.isFinite(features.activePostings) ? features.activePostings : -1,
      workerSearch: features.workerSearch,
      priorityListing: features.priorityListing,
      multiUser: features.multiUser,
      customCounties: features.customCounties,
      brandedReports: features.brandedReports,
      applicantSms: features.applicantSms,
    },
    hasPaymentMethod: Boolean(profile.stripeSubId),
    stripeConfigured: stripe !== null,
    priceCohort: null,
  });
});

employerBillingRoutes.get('/history', async (c) => {
  const userId = c.var.userId;
  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  const events = await c.var.db.billingEvent.findMany({
    where: { employerId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return ok(c, {
    events: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      processedAt: e.processedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

employerBillingRoutes.post('/checkout', validate('json', CheckoutBody), async (c) => {
  const userId = c.var.userId;
  const body = c.var.body;

  const stripe = getStripe();
  if (!stripe) return err(c, 503, 'stripe_unavailable', 'stripe_not_configured');

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');
  if (!isVerified(profile)) return err(c, 403, 'not_verified');
  if (profile.stripeSubId) return err(c, 409, 'conflict', 'already_subscribed');

  const cohort = await resolveCheckoutCohort();

  if (!hasPriceId(body.tier, body.interval, cohort)) {
    return err(c, 503, 'stripe_unavailable', 'price_not_configured');
  }

  let customerId = profile.stripeCustomer;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: profile.legalName,
      email: profile.contactEmail ?? undefined,
      metadata: { employerId: profile.id, tenantId: profile.tenantId },
    });
    customerId = customer.id;
    await c.var.db.employerProfile.update({
      where: { id: profile.id },
      data: { stripeCustomer: customerId },
    });
  }

  const locale = body.locale === 'es' ? 'es' : 'en';
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceIdFor(body.tier, body.interval, cohort), quantity: 1 }],
    success_url: `${webUrl()}/${locale}/employer/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webUrl()}/${locale}/employer/billing`,
    metadata: { employerId: profile.id, tier: body.tier, interval: body.interval, cohort },
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
  });

  if (!session.url) return err(c, 500, 'stripe_session_invalid');

  return ok(c, { url: session.url });
});

employerBillingRoutes.post('/portal', validate('json', PortalBody), async (c) => {
  const userId = c.var.userId;
  const body = c.var.body;
  const stripe = getStripe();
  if (!stripe) return err(c, 503, 'stripe_unavailable', 'stripe_not_configured');

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile?.stripeCustomer) return err(c, 404, 'not_found', 'no_customer');

  const locale = body.locale === 'es' ? 'es' : 'en';
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomer,
    return_url: `${webUrl()}/${locale}/employer/billing`,
  });

  return ok(c, { url: portal.url });
});
