import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type Stripe from 'stripe';
import { adminDb, pools, runWithRlsContext } from '@agconn/db';

// Verified webhooks write as app.role = 'webhook' through agconn_app (pnpm test:db).
process.env.AUDIT_HMAC_KEY ??= Buffer.alloc(48, 7).toString('base64');
const { processStripeEvent } = await import('./stripe-events.js');
const { handleStop } = await import('./twilio-optin.js');

const TENANT = '0f1e0000-0000-4000-8000-000000000b01';
const PROFILE = '0f1e0000-0000-4000-8000-000000000b02';
const PHONE = '+15595550199';
const run = Date.now().toString(36);

async function clear(): Promise<void> {
  await adminDb.$executeRaw`DELETE FROM billing_events WHERE employer_id = ${PROFILE}::uuid`;
  await adminDb.$executeRaw`DELETE FROM employer_profiles WHERE id = ${PROFILE}::uuid`;
  await adminDb.$executeRaw`DELETE FROM tenants WHERE id = ${TENANT}::uuid`;
  await adminDb.$executeRaw`DELETE FROM sms_opt_out WHERE phone = ${PHONE}`;
}

before(async () => {
  await clear();
  await adminDb.tenant.create({ data: { id: TENANT, slug: 'webhook-fixture', name: 'Webhook fixture' } });
  await adminDb.employerProfile.create({ data: { id: PROFILE, tenantId: TENANT, legalName: 'Webhook Fixture Farms' } });
});

after(async () => {
  await clear();
  await adminDb.$disconnect();
  await pools.shared.$disconnect();
  await pools.webhooks.$disconnect();
});

test('a Stripe checkout event records itself and updates the employer', async () => {
  const event = {
    id: `evt_fixture_${run}`,
    type: 'checkout.session.completed',
    data: { object: { metadata: { employerId: PROFILE }, customer: `cus_fixture_${run}`, subscription: `sub_fixture_${run}` } },
  } as unknown as Stripe.Event;
  await runWithRlsContext({ role: 'webhook' }, () => processStripeEvent(event));
  const profile = await adminDb.employerProfile.findUniqueOrThrow({ where: { id: PROFILE } });
  assert.equal(profile.stripeCustomer, `cus_fixture_${run}`);
  const recorded = await adminDb.billingEvent.findFirstOrThrow({ where: { stripeEventId: event.id } });
  assert.ok(recorded.processedAt);
});

test('a Twilio STOP records the opt-out', async () => {
  await runWithRlsContext({ role: 'webhook' }, () => handleStop(PHONE));
  const row = await adminDb.smsOptOut.findUnique({ where: { phone: PHONE } });
  assert.equal(row?.source, 'STOP');
});
