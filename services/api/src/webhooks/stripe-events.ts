import type Stripe from 'stripe';
import { dbClients, EmployerPlanTier, PlanInterval } from '@agconn/db';
import { priceIdToInterval, priceIdToTier } from '@agconn/schemas';
import { enqueueEmployerEmail } from '@agconn/email';
import { emitSystemAudit } from '../middleware/audit.js';

const db = () => dbClients.webhooks;

// Records the event once (stripe_event_id is unique), applies it, and marks it processed or failed.
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  const employerId = await resolveEmployerId(event);
  if (!employerId) {
    console.warn('[stripe webhook] unrecognized event', event.id, event.type);
    return;
  }
  const employer = await db().employerProfile.findUnique({ where: { id: employerId } });
  if (!employer) return;
  const eventRowId = await recordEvent(event, employer);
  if (!eventRowId) return;
  try {
    await applyEvent(event, employer.id);
    await db().billingEvent.update({ where: { id: eventRowId }, data: { processedAt: new Date() } });
  } catch (e) {
    await db().billingEvent.update({
      where: { id: eventRowId },
      data: { errorMsg: e instanceof Error ? e.message : String(e) },
    });
    throw e;
  }
}

async function recordEvent(event: Stripe.Event, employer: { id: string; tenantId: string }): Promise<string | null> {
  try {
    const created = await db().billingEvent.create({
      data: {
        tenantId: employer.tenantId,
        employerId: employer.id,
        eventType: event.type,
        stripeEventId: event.id,
        payload: event as unknown as object,
      },
    });
    return created.id;
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return null; // duplicate event id
    throw e;
  }
}

async function applyEvent(event: Stripe.Event, employerId: string): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, employerId);
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return handleSubUpdated(event.data.object as Stripe.Subscription, employerId);
    case 'customer.subscription.deleted':
      return handleSubDeleted(event.data.object as Stripe.Subscription, employerId);
    case 'invoice.payment_succeeded':
      return handlePaymentSucceeded(event.data.object as Stripe.Invoice, employerId);
    case 'invoice.payment_failed':
      return handlePaymentFailed(event.data.object as Stripe.Invoice, employerId);
  }
}

async function resolveEmployerId(event: Stripe.Event): Promise<string | null> {
  const obj = event.data.object as { metadata?: Stripe.Metadata; customer?: string | Stripe.Customer | null };
  const meta = obj.metadata ?? {};
  if (typeof meta.employerId === 'string') return meta.employerId;
  const customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id;
  if (!customerId) return null;
  const employer = await db().employerProfile.findUnique({
    where: { stripeCustomer: customerId },
    select: { id: true },
  });
  return employer?.id ?? null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, employerId: string) {
  await db().employerProfile.update({
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

  const previous = await db().employerProfile.findUnique({
    where: { id: employerId },
    select: { plan: true, tenantId: true },
  });

  await db().employerProfile.update({
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
    const employer = await db().employerProfile.findUnique({ where: { id: employerId } });
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
  const before = await db().employerProfile.findUnique({
    where: { id: employerId },
    select: { plan: true, tenantId: true, contactEmail: true },
  });
  await db().employerProfile.update({
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
  const employer = await db().employerProfile.findUnique({ where: { id: employerId } });
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
  const employer = await db().employerProfile.findUnique({ where: { id: employerId } });
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
