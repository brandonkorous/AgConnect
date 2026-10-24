import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import {
  serviceNoTenantMiddleware,
  type ServiceNoTenantVars,
} from '../middleware/tenantContext.js';
import { getImpact } from './impact-query.js';

// `applications`, `enrollments`, and `employer_profiles` only expose
// cross-tenant SELECT to the `service` role (their *_service policies are
// role-only, no tenant_id match). The aggregate impact metrics need that
// breadth, so this route runs under service-without-a-pinned-tenant rather
// than under the anonymous role used by the marketplace endpoints.
export const impactRoutes = new Hono<{ Variables: ServiceNoTenantVars }>();
impactRoutes.use('*', serviceNoTenantMiddleware('landing'));

impactRoutes.get('/', async (c) => ok(c, await getImpact(c.var.db)));
