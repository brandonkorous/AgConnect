import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import { JobStatus } from '@agconn/db';
import { publicTenantMiddleware, type TenantVars } from '../middleware/tenantContext.js';

export const featuredJobsRoutes = new Hono<{ Variables: TenantVars }>();
featuredJobsRoutes.use('*', publicTenantMiddleware('landing'));

const TAKE = 4;

featuredJobsRoutes.get('/', async (c) => {
  const rows = await c.var.db.jobPosting.findMany({
    where: {
      tenantId: c.var.tenantId,
      status: JobStatus.active,
      deletedAt: null,
      employer: {
        employerProfile: { flcVerifiedAt: { not: null } },
      },
    },
    orderBy: [{ wageMax: 'desc' }, { publishedAt: 'desc' }],
    take: TAKE,
    include: {
      employer: { include: { employerProfile: true } },
    },
  });

  const jobs = rows.map((r) => ({
    id: r.id,
    seoSlug: r.seoSlug,
    titleEn: r.titleEn,
    titleEs: r.titleEs,
    county: r.county,
    wageMin: Number(r.wageMin),
    wageMax: Number(r.wageMax),
    wageUnit: r.wageUnit,
    startDate: r.startDate.toISOString().slice(0, 10),
    employerName: r.employer.employerProfile?.dbaName ?? r.employer.employerProfile?.legalName ?? '',
    employerVerified: true as const,
    skills: r.skills,
    publishedAt: r.publishedAt?.toISOString() ?? null,
  }));

  return ok(c, { jobs });
});
