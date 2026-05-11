import { PrismaNamespace, type Tx } from '@agconn/db';
import type { KpiQuery } from './schemas.js';

export type Trend = { count: number; deltaPct: number | null };

export type KpiSummary = {
  placements: {
    count: number;
    uniqueWorkers: number;
    avgWage: number | null;
    trend: Trend;
  };
  training: {
    completedCount: number;
    uniqueWorkers: number;
    certCount: number;
    trend: Trend;
  };
  employers: {
    activeCount: number;
    postingsCount: number;
    hireRate: number | null;
    trend: Trend;
  };
  wages: {
    distribution: { bucket: number; n: number }[];
    median: number | null;
    p10: number | null;
    p90: number | null;
  };
  range: { start: string; end: string };
};

type Range = { start: Date; end: Date };

function priorPeriod({ start, end }: Range): Range {
  const ms = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - ms), end: start };
}

function deltaPct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

async function placementsAt(
  db: Tx,
  range: Range,
  filters: { tenantIds?: string[]; counties?: string[] },
): Promise<{ count: number; uniqueWorkers: number; avgWage: number | null }> {
  // groupBy by worker_id is overkill for "unique workers"; aggregate twice
  // is cheaper for small windows. For now, single aggregate + distinct.
  const where: Record<string, unknown> = {
    status: 'hired',
    hiredAt: { gte: range.start, lt: range.end },
    deletedAt: null,
  };
  if (filters.tenantIds?.length) where['tenantId'] = { in: filters.tenantIds };
  if (filters.counties?.length) {
    where['job'] = { county: { in: filters.counties } };
  }

  const [agg, distinct] = await Promise.all([
    db.application.aggregate({
      where,
      _count: { _all: true },
      _avg: { wageOffered: true },
    }),
    db.application.findMany({
      where,
      select: { workerId: true },
      distinct: ['workerId'],
    }),
  ]);

  return {
    count: agg._count._all,
    uniqueWorkers: distinct.length,
    avgWage: agg._avg.wageOffered ? Number(agg._avg.wageOffered) : null,
  };
}

async function trainingAt(
  db: Tx,
  range: Range,
  filters: { tenantIds?: string[] },
): Promise<{ completedCount: number; uniqueWorkers: number; certCount: number }> {
  const where: Record<string, unknown> = {
    status: 'completed',
    completedAt: { gte: range.start, lt: range.end },
    deletedAt: null,
  };
  if (filters.tenantIds?.length) where['tenantId'] = { in: filters.tenantIds };

  const [agg, distinct, certCount] = await Promise.all([
    db.enrollment.count({ where }),
    db.enrollment.findMany({ where, select: { workerId: true }, distinct: ['workerId'] }),
    db.enrollment.count({ where: { ...where, certificateId: { not: null } } }),
  ]);

  return { completedCount: agg, uniqueWorkers: distinct.length, certCount };
}

async function employersAt(
  db: Tx,
  range: Range,
  filters: { tenantIds?: string[] },
): Promise<{ activeCount: number; postingsCount: number; hireRate: number | null }> {
  const tenantFilter = filters.tenantIds?.length
    ? { tenantId: { in: filters.tenantIds } }
    : {};

  const [activeEmployersAgg, postingsCount, hiredAgg, appliedAgg] = await Promise.all([
    db.jobPosting.findMany({
      where: { ...tenantFilter, status: 'active' },
      select: { tenantId: true },
      distinct: ['tenantId'],
    }),
    db.jobPosting.count({
      where: {
        ...tenantFilter,
        createdAt: { gte: range.start, lt: range.end },
      },
    }),
    db.application.count({
      where: {
        ...tenantFilter,
        status: 'hired',
        appliedAt: { gte: range.start, lt: range.end },
        deletedAt: null,
      },
    }),
    db.application.count({
      where: {
        ...tenantFilter,
        appliedAt: { gte: range.start, lt: range.end },
        deletedAt: null,
      },
    }),
  ]);

  return {
    // Distinct active *tenants* is a proxy; per spec the dimension is per-employer
    // (employer_profiles.id), which we'll wire when the directory is built. The
    // tile shows directionally correct activity for now.
    activeCount: activeEmployersAgg.length,
    postingsCount,
    hireRate: appliedAgg === 0 ? null : hiredAgg / appliedAgg,
  };
}

async function wageDistribution(
  db: Tx,
  range: Range,
  filters: { tenantIds?: string[]; counties?: string[] },
): Promise<{
  distribution: { bucket: number; n: number }[];
  median: number | null;
  p10: number | null;
  p90: number | null;
}> {
  const tenantClause = filters.tenantIds?.length
    ? PrismaNamespace.sql`AND a.tenant_id = ANY(${filters.tenantIds}::uuid[])`
    : PrismaNamespace.empty;
  const countyClause = filters.counties?.length
    ? PrismaNamespace.sql`AND j.county = ANY(${filters.counties}::county[])`
    : PrismaNamespace.empty;

  const rows = await db.$queryRaw<{ bucket: number; n: bigint }[]>(
    PrismaNamespace.sql`
      SELECT WIDTH_BUCKET(a.wage_offered::numeric, 14, 30, 8)::int AS bucket,
             COUNT(*)::bigint AS n
      FROM applications a
      JOIN job_postings j ON j.id = a.job_id
      WHERE a.status = 'hired'
        AND a.hired_at >= ${range.start}
        AND a.hired_at <  ${range.end}
        AND a.deleted_at IS NULL
        AND a.wage_offered IS NOT NULL
        ${tenantClause}
        ${countyClause}
      GROUP BY bucket
      ORDER BY bucket
    `,
  );

  const distribution = rows.map((r) => ({ bucket: Number(r.bucket), n: Number(r.n) }));

  const percentiles = await db.$queryRaw<
    { median: number | null; p10: number | null; p90: number | null }[]
  >(
    PrismaNamespace.sql`
      SELECT
        percentile_cont(0.5) WITHIN GROUP (ORDER BY a.wage_offered::numeric) AS median,
        percentile_cont(0.1) WITHIN GROUP (ORDER BY a.wage_offered::numeric) AS p10,
        percentile_cont(0.9) WITHIN GROUP (ORDER BY a.wage_offered::numeric) AS p90
      FROM applications a
      JOIN job_postings j ON j.id = a.job_id
      WHERE a.status = 'hired'
        AND a.hired_at >= ${range.start}
        AND a.hired_at <  ${range.end}
        AND a.deleted_at IS NULL
        AND a.wage_offered IS NOT NULL
        ${tenantClause}
        ${countyClause}
    `,
  );

  const p = percentiles[0];
  return {
    distribution,
    median: p?.median != null ? Number(p.median) : null,
    p10: p?.p10 != null ? Number(p.p10) : null,
    p90: p?.p90 != null ? Number(p.p90) : null,
  };
}

export async function buildKpiSummary(db: Tx, q: KpiQuery): Promise<KpiSummary> {
  const range: Range = {
    start: new Date(`${q.start}T00:00:00Z`),
    end: new Date(`${q.end}T00:00:00Z`),
  };
  const prior = priorPeriod(range);
  const f = { tenantIds: q.tenantIds, counties: q.counties };

  const [placeNow, placePrev, trainNow, trainPrev, empNow, empPrev, wages] = await Promise.all([
    placementsAt(db, range, f),
    placementsAt(db, prior, f),
    trainingAt(db, range, { tenantIds: q.tenantIds }),
    trainingAt(db, prior, { tenantIds: q.tenantIds }),
    employersAt(db, range, { tenantIds: q.tenantIds }),
    employersAt(db, prior, { tenantIds: q.tenantIds }),
    wageDistribution(db, range, f),
  ]);

  return {
    placements: {
      ...placeNow,
      trend: { count: placePrev.count, deltaPct: deltaPct(placeNow.count, placePrev.count) },
    },
    training: {
      ...trainNow,
      trend: {
        count: trainPrev.completedCount,
        deltaPct: deltaPct(trainNow.completedCount, trainPrev.completedCount),
      },
    },
    employers: {
      ...empNow,
      trend: {
        count: empPrev.activeCount,
        deltaPct: deltaPct(empNow.activeCount, empPrev.activeCount),
      },
    },
    wages,
    range: { start: q.start, end: q.end },
  };
}
