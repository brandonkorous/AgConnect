import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import { getFounderSlots } from '../employer/billing/founder-slots';
import { publicTenantMiddleware, type TenantVars } from '../middleware/tenantContext';

export const founderSlotsRoutes = new Hono<{ Variables: TenantVars }>();
founderSlotsRoutes.use('*', publicTenantMiddleware('landing'));

founderSlotsRoutes.get('/', async (c) => {
  const slots = await getFounderSlots();
  c.header('Cache-Control', 'public, max-age=30, s-maxage=30');
  return ok(c, slots);
});
