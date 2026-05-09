import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import { getFounderSlots } from '../employer/billing/founder-slots.js';

// `getFounderSlots` opens its own `runWithRlsContext({ role: 'service' })`
// for the cross-tenant count, so this route deliberately runs without the
// landing tenant middleware — there is no per-request RLS context to set.
export const founderSlotsRoutes = new Hono();

founderSlotsRoutes.get('/', async (c) => {
  const slots = await getFounderSlots();
  c.header('Cache-Control', 'public, max-age=30, s-maxage=30');
  return ok(c, slots);
});
