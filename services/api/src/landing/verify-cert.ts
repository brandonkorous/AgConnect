import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { EnrollmentStatus } from '@agconn/db';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  serviceNoTenantMiddleware,
  type ServiceNoTenantVars,
} from '../middleware/tenantContext.js';

const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

export const verifyCertRoutes = new Hono<{ Variables: ServiceNoTenantVars }>();
verifyCertRoutes.use('*', serviceNoTenantMiddleware('landing'));
verifyCertRoutes.use(
  '*',
  rateLimit({
    windows: [
      { windowMs: MIN_MS, max: 12 },
      { windowMs: HOUR_MS, max: 120 },
    ],
  }),
);

verifyCertRoutes.get('/:certificateId', async (c) => {
  const certificateId = c.req.param('certificateId').trim();
  if (!certificateId) return err(c, 404, 'not_found');

  const enrollment = await c.var.db.enrollment.findFirst({
    where: {
      certificateId,
      status: EnrollmentStatus.completed,
      deletedAt: null,
    },
    include: {
      program: { include: { org: true } },
      worker: { include: { workerProfile: true } },
    },
  });

  if (!enrollment) {
    return ok(c, { valid: false, certificateId });
  }

  const profile = enrollment.worker.workerProfile;
  const firstName = profile?.firstName ?? '';
  const lastInitial = profile?.lastName?.trim()?.[0]?.toUpperCase() ?? '';

  return ok(c, {
    valid: true,
    certificateId,
    programTitleEn: enrollment.program.titleEn,
    programTitleEs: enrollment.program.titleEs,
    workerFirstName: firstName,
    workerLastInitial: lastInitial,
    org: enrollment.program.org?.email ?? 'Training organization',
    funder: enrollment.program.funder,
    completedAt: enrollment.completedAt?.toISOString().slice(0, 10) ?? null,
  });
});
