import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import { AppStatus, EnrollmentStatus } from '@agconn/db';
import {
  serviceNoTenantMiddleware,
  type ServiceNoTenantVars,
} from '../middleware/tenantContext.js';

// `applications`, `enrollments`, and `employer_profiles` only expose
// cross-tenant SELECT to the `service` role (their *_service policies are
// role-only, no tenant_id match). The aggregate impact metrics need that
// breadth, so this route runs under service-without-a-pinned-tenant rather
// than under the anonymous role used by the marketplace endpoints.
export const impactRoutes = new Hono<{ Variables: ServiceNoTenantVars }>();
impactRoutes.use('*', serviceNoTenantMiddleware('landing'));

const SUPPRESSION_THRESHOLD = 25;
const WINDOW_MONTHS = 12;

function roundToNearest(n: number, multiple: number) {
  return Math.round(n / multiple) * multiple;
}

function suppress<T>(count: number, value: T): T | null {
  return count < SUPPRESSION_THRESHOLD ? null : value;
}

impactRoutes.get('/', async (c) => {
  const since = new Date();
  since.setMonth(since.getMonth() - WINDOW_MONTHS);

  const [hiredCount, hiredWages, completedCount, verifiedEmployers] = await Promise.all([
    c.var.db.application.count({
      where: {
        status: AppStatus.hired,
        hiredAt: { gte: since },
        deletedAt: null,
      },
    }),
    c.var.db.application.findMany({
      where: {
        status: AppStatus.hired,
        hiredAt: { gte: since },
        deletedAt: null,
        wageOffered: { not: null },
      },
      select: { wageOffered: true },
    }),
    c.var.db.enrollment.count({
      where: {
        status: EnrollmentStatus.completed,
        completedAt: { gte: since },
        deletedAt: null,
      },
    }),
    c.var.db.employerProfile.count({
      where: {
        flcVerifiedAt: { not: null },
        deletedAt: null,
      },
    }),
  ]);

  const wages = hiredWages
    .map((a) => Number(a.wageOffered))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  function median(sorted: number[]): number | null {
    if (sorted.length === 0) return null;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid] ?? null;
    const lo = sorted[mid - 1];
    const hi = sorted[mid];
    return lo == null || hi == null ? null : (lo + hi) / 2;
  }
  const medianWage = median(wages);

  return ok(c, {
    workersPlaced: suppress(hiredCount, roundToNearest(hiredCount, 10)),
    medianWage:
      medianWage == null
        ? null
        : suppress(hiredCount, Math.round(medianWage * 100) / 100),
    trainingsCompleted: suppress(completedCount, roundToNearest(completedCount, 10)),
    verifiedEmployers,
    generatedAt: new Date().toISOString(),
    windowMonths: WINDOW_MONTHS,
    source: 'WIOA-aligned · nightly · cross-tenant',
  });
});
