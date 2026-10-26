import { Hono } from 'hono';
import type Stripe from 'stripe';
import { runWithRlsContext } from '@agconn/db';
import { getStripe, stripeWebhookSecret } from '../employer/billing/stripe.js';
import { ok, err } from '@agconn/api-client/server';
import { processStripeEvent } from './stripe-events.js';

export const stripeWebhookRoutes = new Hono();

// A verified Stripe event runs as app.role = 'webhook' (cross-tenant on billing rows by design).
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

  await runWithRlsContext({ role: 'webhook' }, () => processStripeEvent(event));
  return ok(c, { ok: true });
});
