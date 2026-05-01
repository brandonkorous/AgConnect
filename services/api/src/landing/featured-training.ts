import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import { ProgramStatus } from '@agconn/db';
import { publicTenantMiddleware, type TenantVars } from '../middleware/tenantContext';

export const featuredTrainingRoutes = new Hono<{ Variables: TenantVars }>();
featuredTrainingRoutes.use('*', publicTenantMiddleware);

const TAKE = 4;

featuredTrainingRoutes.get('/', async (c) => {
  const rows = await c.var.db.trainingProgram.findMany({
    where: {
      tenantId: c.var.tenantId,
      status: { in: [ProgramStatus.active, ProgramStatus.full] },
      deletedAt: null,
      startDate: { gte: new Date() },
    },
    orderBy: [{ startDate: 'asc' }],
    take: TAKE,
    include: { org: { include: { employerProfile: true } } },
  });

  const programs = rows.map((r) => ({
    id: r.id,
    seoSlug: r.seoSlug,
    titleEn: r.titleEn,
    titleEs: r.titleEs,
    funder: r.funder,
    county: r.county,
    startDate: r.startDate.toISOString().slice(0, 10),
    endDate: r.endDate.toISOString().slice(0, 10),
    capacity: r.capacity,
    enrolledCount: r.enrolledCount,
    spotsLeft: Math.max(0, r.capacity - r.enrolledCount),
    orgName: r.org.employerProfile?.legalName ?? r.org.email ?? 'Training organization',
    locationName: r.locationName,
  }));

  return ok(c, { programs });
});
