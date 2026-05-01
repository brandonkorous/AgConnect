import { Hono } from 'hono';
import type Stripe from 'stripe';
import { prisma, EmployerPlanTier, PlanInterval } from '@agconn/db';
import { priceIdToInterval, priceIdToTier } from '@agconn/schemas';
import { enqueueEmployerEmail } from '@agconn/email';
import { getStripe, stripeWebhookSecret } from '../employer/billing/stripe';
import { ok, err } from '@agconn/api-client/server';
import { emitSystemAudit } from '../middleware/audit';

export const stripeWebhookRoutes = new Hono();

stripeWebhookRoutes.post('/', async (c) => {
  const stripe = getStripe();
  const secret = stripeWebhookSecret();
  if (!stripe || !secret) return err(c, 503, 'stripe_unavailable');

  const sig = c.req.header('stripe-signature') ?? '';
  const body = await c.req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    console.warn('[stripe webhook] signature failed', e);
    return err(c, 401, 'invalid_signature');
  }

  // Resolve the employer this event belongs to (for new customers, metadata
  // carries it; for existing ones, look up via stripe_customer).
  const employerId = await resolveEmployerId(event);
  if (!employerId) {
    // Unknown — log + 200 so Stripe stops retrying.
    console.warn('[stripe webhook] unrecognized event', event.id, event.type);
    return ok(c, { ok: true });
  }
  const employer = await prisma.employerProfile.findUnique({ where: { id: employerId } });
  if (!employer) return ok(c, { ok: true });

  // Idempotency via stripe_event_id unique constraint.
  let eventRowId: string;
  try {
    const created = await prisma.billingEvent.create({
      data: {
        tenantId: employer.tenantId,
        employerId: employer.id,
        eventType: event.type,
        stripeEventId: event.id,
        payload: event as unknown as object,
      },
    });
    eventRowId = created.id;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'P2002') return ok(c, { ok: true });    // duplicate event id
    throw e;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, employer.id);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubUpdated(event.data.object as Stripe.Subscription, employer.id);
        break;
      case 'customer.subscription.deleted':
        await handleSubDeleted(event.data.object as Stripe.Subscription, employer.id);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, employer.id);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, employer.id);
        break;
    }
    await prisma.billingEvent.update({
      where: { id: eventRowId },
      data: { processedAt: new Date() },
    });
  } catch (e) {
    await prisma.billingEvent.update({
      where: { id: eventRowId },
      data: { errorMsg: e instanceof Error ? e.message : String(e) },
    });
    throw e;
  }

  return ok(c, { ok: true });
});

async function resolveEmployerId(event: Stripe.Event): Promise<string | null> {
  const obj = event.data.object as { metadata?: Stripe.Metadata; customer?: string | Stripe.Customer | null };
  const meta = obj.metadata ?? {};
  if (typeof meta.employerId === 'string') return meta.employerId;
  const customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id;
  if (!customerId) return null;
  const employer = await prisma.employerProfile.findUnique({
    where: { stripeCustomer: customerId },
    select: { id: true },
  });
  return employer?.id ?? null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, employerId: string) {
  await prisma.employerProfile.update({
    where: { id: employerId },
    data: {
      stripeCustomer:
        typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null),
      stripeSubId:
        typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription?.id ?? null),
    },
  });
}

async function handleSubUpdated(sub: Stripe.Subscription, employerId: string) {
  const priceId = sub.items.data[0]?.price.id;
  if (!priceId) return;
  const tier = priceIdToTier(priceId);
  const interval = priceIdToInterval(priceId);
  if (!tier || !interval) {
    console.warn('[stripe webhook] unknown price id', priceId);
    return;
  }
  const isActive = ['active', 'trialing'].includes(sub.status);
  const periodEnd = (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end;

  const previous = await prisma.employerProfile.findUnique({
    where: { id: employerId },
    select: { plan: true, tenantId: true },
  });

  await prisma.employerProfile.update({
    where: { id: employerId },
    data: {
      plan: isActive ? (tier as EmployerPlanTier) : EmployerPlanTier.free,
      planInterval: isActive ? (interval as PlanInterval) : null,
      planCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      planCancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      stripeSubId: sub.id,
    },
  });

  if (isActive && previous?.plan === 'free') {
    await emitSystemAudit({
      action: 'billing.subscription.created',
      tenantId: previous.tenantId,
      resourceId: employerId,
      metadata: { plan: tier, stripeSubscriptionId: sub.id, priceId },
    });
    const employer = await prisma.employerProfile.findUnique({ where: { id: employerId } });
    if (employer?.contactEmail) {
      await enqueueEmployerEmail({
        template: 'employer.billing.subscription_started',
        employerId,
        tenantId: employer.tenantId,
        to: employer.contactEmail,
        locale: 'en',
        vars: { plan: tier, interval },
        idempotencyKey: `billing-started-${sub.id}`,
      });
    }
  }
}

async function handleSubDeleted(sub: Stripe.Subscription, employerId: string) {
  const before = await prisma.employerProfile.findUnique({
    where: { id: employerId },
    select: { plan: true, tenantId: true, contactEmail: true },
  });
  await prisma.employerProfile.update({
    where: { id: employerId },
    data: {
      plan: EmployerPlanTier.free,
      planInterval: null,
      stripeSubId: null,
      planCurrentPeriodEnd: null,
      planCancelAtPeriodEnd: false,
    },
  });
  if (before) {
    await emitSystemAudit({
      action: 'billing.subscription.canceled',
      tenantId: before.tenantId,
      resourceId: employerId,
      metadata: { plan: before.plan, stripeSubscriptionId: sub.id, reason: 'stripe_event' },
    });
  }
  if (before?.contactEmail) {
    await enqueueEmployerEmail({
      template: 'employer.billing.subscription_canceled',
      employerId,
      tenantId: before.tenantId,
      to: before.contactEmail,
      locale: 'en',
      vars: {},
      idempotencyKey: `billing-canceled-${sub.id}`,
    });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, employerId: string) {
  const employer = await prisma.employerProfile.findUnique({ where: { id: employerId } });
  if (!employer) return;
  await emitSystemAudit({
    action: 'billing.payment.succeeded',
    tenantId: employer.tenantId,
    resourceId: employerId,
    metadata: {
      amountCents: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? 'usd',
      stripeInvoiceId: invoice.id ?? '',
    },
  });
  if (!employer.contactEmail) return;
  await enqueueEmployerEmail({
    template: 'employer.billing.invoice_paid',
    employerId,
    tenantId: employer.tenantId,
    to: employer.contactEmail,
    locale: 'en',
    vars: {
      amount: (invoice.amount_paid ?? 0) / 100,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? '',
      pdfUrl: invoice.invoice_pdf ?? '',
    },
    idempotencyKey: `billing-paid-${invoice.id ?? Math.random().toString(36).slice(2)}`,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice, employerId: string) {
  const employer = await prisma.employerProfile.findUnique({ where: { id: employerId } });
  if (!employer) return;
  await emitSystemAudit({
    action: 'billing.payment.failed',
    tenantId: employer.tenantId,
    resourceId: employerId,
    outcome: 'failure',
    metadata: {
      amountCents: invoice.amount_due ?? 0,
      currency: invoice.currency ?? 'usd',
      stripeInvoiceId: invoice.id ?? '',
      failureCode: invoice.status ?? 'unknown',
    },
  });
  if (!employer.contactEmail) return;
  await enqueueEmployerEmail({
    template: 'employer.billing.payment_failed',
    employerId,
    tenantId: employer.tenantId,
    to: employer.contactEmail,
    locale: 'en',
    vars: { amount: (invoice.amount_due ?? 0) / 100 },
    idempotencyKey: `billing-failed-${invoice.id ?? Math.random().toString(36).slice(2)}`,
  });
}
