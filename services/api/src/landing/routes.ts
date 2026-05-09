import { Hono } from 'hono';
import { ok, validate } from '@agconn/api-client/server';
import { waitlistRequestSchema, tokenQuerySchema } from './schemas.js';
import {
  addToWaitlist,
  confirmWaitlist,
  unsubscribeWaitlist,
} from './service.js';
import { featuredJobsRoutes } from './featured-jobs.js';
import { featuredTrainingRoutes } from './featured-training.js';
import { impactRoutes } from './impact.js';
import { founderSlotsRoutes } from './founder-slots.js';
import { verifyCertRoutes } from './verify-cert.js';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  serviceNoTenantMiddleware,
  type ServiceNoTenantVars,
} from '../middleware/tenantContext.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const landingRoutes = new Hono();

landingRoutes.route('/featured-jobs', featuredJobsRoutes);
landingRoutes.route('/featured-training', featuredTrainingRoutes);
landingRoutes.route('/impact', impactRoutes);
landingRoutes.route('/founder-slots', founderSlotsRoutes);
landingRoutes.route('/verify-cert', verifyCertRoutes);

// Waitlist signup, confirm, and unsubscribe all run under the service role
// without a pinned tenant. Anonymous role only grants INSERT on waitlist —
// addToWaitlist needs SELECT/UPDATE for the upsert path, and
// confirm/unsubscribe need SELECT/UPDATE too. The relaxed `waitlist_service`
// and `email_log_service` policies cover NULL-tenant rows when
// `app.tenant_id` is empty (NULLIF coerces to NULL).
const tokenActionRoutes = new Hono<{ Variables: ServiceNoTenantVars }>();
tokenActionRoutes.use('*', serviceNoTenantMiddleware('landing'));

tokenActionRoutes.post(
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
    const result = await addToWaitlist(c.var.db, body);
    return ok(c, result);
  },
);

tokenActionRoutes.get(
  '/waitlist/confirm',
  validate('query', tokenQuerySchema),
  async (c) => {
    const { token } = c.var.body;
    const { result, locale } = await confirmWaitlist(c.var.db, token);

    const webBase = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return c.redirect(`${webBase}/${locale}/confirm?status=${result}`, 302);
  },
);

tokenActionRoutes.get(
  '/unsubscribe',
  validate('query', tokenQuerySchema),
  async (c) => {
    const { token } = c.var.body;
    const { result, locale } = await unsubscribeWaitlist(c.var.db, token);

    const webBase = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return c.redirect(`${webBase}/${locale}/unsubscribe?status=${result}`, 302);
  },
);

tokenActionRoutes.post(
  '/unsubscribe',
  validate('query', tokenQuerySchema),
  async (c) => {
    const { token } = c.var.body;
    await unsubscribeWaitlist(c.var.db, token);
    return ok(c, { unsubscribed: true });
  },
);

landingRoutes.route('/', tokenActionRoutes);
