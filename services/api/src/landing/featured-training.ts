import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import { ProgramStatus } from '@agconn/db';
import { anonymousMiddleware, type AnonymousVars } from '../middleware/tenantContext.js';

export const featuredTrainingRoutes = new Hono<{ Variables: AnonymousVars }>();
featuredTrainingRoutes.use('*', anonymousMiddleware('landing'));

const TAKE = 4;

featuredTrainingRoutes.get('/', async (c) => {
  const rows = await c.var.db.trainingProgram.findMany({
    where: {
      status: { in: [ProgramStatus.active, ProgramStatus.full] },
      deletedAt: null,
      startDate: { gte: new Date() },
    },
    orderBy: [{ startDate: 'asc' }],
    take: TAKE,
    include: {
      org: {
        select: {
          email: true,
          employerContacts: {
            where: { deletedAt: null },
            take: 1,
            select: { employer: { select: { legalName: true } } },
          },
        },
      },
    },
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
    orgName:
      r.org.employerContacts[0]?.employer.legalName ??
      r.org.email ??
      'Training organization',
    locationName: r.locationName,
  }));

  return ok(c, { programs });
});
