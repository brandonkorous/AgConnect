import { EnrollmentStatus, JobStatus, PrismaNamespace, UserRole, type Db } from '@agconn/db';

const SUPPRESSION_THRESHOLD = 25;
export const WINDOW_MONTHS = 12;
const CACHE_MS = 60 * 60 * 1000;

export type ImpactBody = {
  workersPlaced: number | null;
  medianWage: number | null;
  trainingsCompleted: number | null;
  verifiedEmployers: number;
  workersTotal: number | null;
  activePostings: number;
  generatedAt: string;
  windowMonths: number;
  source: string;
};

type HiredRow = { hired: number; median: number | null };

function roundToNearest(n: number, multiple: number) {
  return Math.round(n / multiple) * multiple;
}

function suppress<T>(count: number, value: T): T | null {
  return count < SUPPRESSION_THRESHOLD ? null : value;
}

// One transaction (one RLS preamble); the median is computed by Postgres, not in memory.
export async function loadImpact(db: Pick<Db, '$transaction'>, now: Date): Promise<ImpactBody> {
  const since = new Date(now);
  since.setMonth(since.getMonth() - WINDOW_MONTHS);
  const notDeleted = { deletedAt: null };
  const [rows, completedCount, verifiedEmployers, workersTotal, activePostings] =
    await db.$transaction(async (tx) => [
      await tx.$queryRaw<HiredRow[]>(PrismaNamespace.sql`
        SELECT count(*)::int AS hired,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY wage_offered)::float8 AS median
        FROM applications
        WHERE status = 'hired' AND hired_at >= ${since} AND deleted_at IS NULL`),
      await tx.enrollment.count({
        where: { status: EnrollmentStatus.completed, completedAt: { gte: since }, ...notDeleted },
      }),
      await tx.employerProfile.count({ where: { flcVerifiedAt: { not: null }, ...notDeleted } }),
      await tx.user.count({ where: { role: UserRole.worker } }),
      await tx.jobPosting.count({
        where: { status: JobStatus.active, ...notDeleted, employer: { flcVerifiedAt: { not: null } } },
      }),
    ] as const);
  const hiredCount = rows[0]?.hired ?? 0;
  const median = rows[0]?.median ?? null;
  return {
    workersPlaced: suppress(hiredCount, roundToNearest(hiredCount, 10)),
    medianWage: median == null ? null : suppress(hiredCount, Math.round(median * 100) / 100),
    trainingsCompleted: suppress(completedCount, roundToNearest(completedCount, 10)),
    verifiedEmployers,
    workersTotal: suppress(workersTotal, roundToNearest(workersTotal, 10)),
    activePostings,
    generatedAt: now.toISOString(),
    windowMonths: WINDOW_MONTHS,
    source: 'WIOA-aligned · nightly · cross-tenant',
  };
}

let cached: { at: number; body: Promise<ImpactBody> } | null = null;

// The numbers are aggregate and slow-moving: one load per hour, shared by concurrent callers.
export function getImpact(db: Pick<Db, '$transaction'>, now: Date = new Date()): Promise<ImpactBody> {
  if (cached && now.getTime() - cached.at < CACHE_MS) return cached.body;
  const body = loadImpact(db, now);
  const entry = { at: now.getTime(), body };
  cached = entry;
  body.catch(() => {
    if (cached === entry) cached = null;
  });
  return body;
}

export function clearImpactCache(): void {
  cached = null;
}
