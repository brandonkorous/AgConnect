// audit-required:exempt — read-only listing of active hires for the
// current employer; no state mutated. Powers the worker pickers in the
// crews/shifts management modals.

import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import { AppStatus } from '@agconn/db';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

export const employerHiresRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerHiresRoutes.use('*', requireAuth);
employerHiresRoutes.use('*', requireRole('employer'));
employerHiresRoutes.use('*', requireTenant);

employerHiresRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;

  const apps = await c.var.db.application.findMany({
    where: {
      tenantId,
      status: AppStatus.hired,
      deletedAt: null,
      job: { employerId: userId, deletedAt: null },
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      worker: { include: { workerProfile: true } },
      job: { select: { titleEn: true, titleEs: true } },
    },
  });

  // De-duplicate by workerId — a worker may be hired against more than one
  // posting; surface them once with the most recent job title.
  const seen = new Set<string>();
  const workers: Array<{
    workerUserId: string;
    firstName: string;
    lastInitial: string;
    jobTitle: string;
    hiredAt: string;
  }> = [];
  const locale = (c.req.header('accept-language') ?? '').toLowerCase().startsWith('es')
    ? 'es'
    : 'en';

  for (const a of apps) {
    if (seen.has(a.workerId)) continue;
    seen.add(a.workerId);
    const profile = a.worker.workerProfile;
    workers.push({
      workerUserId: a.workerId,
      firstName: profile?.firstName ?? '',
      lastInitial: (profile?.lastName?.[0] ?? '').toUpperCase(),
      jobTitle: locale === 'es' ? a.job.titleEs : a.job.titleEn,
      hiredAt: a.updatedAt.toISOString(),
    });
  }

  return ok(c, { workers });
});
