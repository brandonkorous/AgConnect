import { Hono } from 'hono';
import { ok, validate } from '@agconn/api-client/server';
import { waitlistRequestSchema, tokenQuerySchema } from './schemas';
import {
  addToWaitlist,
  confirmWaitlist,
  unsubscribeWaitlist,
} from './service';
import { rateLimit } from '../middleware/rateLimit';
import { publicTenantMiddleware, type TenantVars } from '../middleware/tenantContext';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const landingRoutes = new Hono<{ Variables: TenantVars }>();

landingRoutes.use('*', publicTenantMiddleware);

landingRoutes.post(
  '/waitlist',
  rateLimit({
    windows: [
      { windowMs: HOUR_MS, max: 10 },
      { windowMs: DAY_MS, max: 30 },
    ],
  }),
  validate('json', waitlistRequestSchema),
  async (c) => {
    const body = c.var.body;
    const result = await addToWaitlist(c.var.db, c.var.tenantId, body);
    return ok(c, result);
  },
);

landingRoutes.get('/waitlist/confirm', validate('query', tokenQuerySchema), async (c) => {
  const { token } = c.var.body;
  const { result, locale } = await confirmWaitlist(c.var.db, token);

  const webBase = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return c.redirect(`${webBase}/${locale}/confirm?status=${result}`, 302);
});

landingRoutes.get('/unsubscribe', validate('query', tokenQuerySchema), async (c) => {
  const { token } = c.var.body;
  const { result, locale } = await unsubscribeWaitlist(c.var.db, token);

  const webBase = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return c.redirect(`${webBase}/${locale}/unsubscribe?status=${result}`, 302);
});

landingRoutes.post('/unsubscribe', validate('query', tokenQuerySchema), async (c) => {
  const { token } = c.var.body;
  await unsubscribeWaitlist(c.var.db, token);
  return ok(c, { unsubscribed: true });
});
