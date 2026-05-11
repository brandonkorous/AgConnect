import { Hono } from 'hono';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import { adminFlagsRoutes } from './flags.js';
import { adminSystemJobsRoutes } from './jobs.js';
import { adminSystemHealthRoutes } from './health.js';
import { adminLookupsRoutes } from './lookups.js';
import { adminAewrRoutes } from './aewr.js';

export const adminSystemRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminSystemRoutes.use('*', clerkAdminAuthMiddleware);
adminSystemRoutes.use('*', requireAdminOrg('admin'));

adminSystemRoutes.route('/flags', adminFlagsRoutes);
adminSystemRoutes.route('/jobs', adminSystemJobsRoutes);
adminSystemRoutes.route('/health', adminSystemHealthRoutes);
adminSystemRoutes.route('/lookups', adminLookupsRoutes);
adminSystemRoutes.route('/aewr', adminAewrRoutes);
