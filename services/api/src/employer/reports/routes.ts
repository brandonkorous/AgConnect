import { Hono } from 'hono';
import { ok, validate } from '@agconn/api-client/server';
import { AppStatus } from '@agconn/db';
import { ReportsOverviewQuery } from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

// audit-required:exempt — CSV exports are read-only views over already-audited
// payroll/application data; the underlying GETs are themselves not mutations.

export const employerReportsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerReportsRoutes.use('*', requireAuth('employer'));
employerReportsRoutes.use('*', requireRole('employer'));
employerReportsRoutes.use('*', requireTenant);

employerReportsRoutes.get('/overview', validate('query', ReportsOverviewQuery), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;

  // Compute season window — current calendar year for now.
  const now = new Date();
  const seasonStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const jobs = await c.var.db.jobPosting.findMany({
    where: { tenantId, employerId: userId, deletedAt: null, createdAt: { gte: seasonStart } },
    select: {
      id: true,
      titleEn: true,
      publishedAt: true,
      filledAt: true,
      positionsTotal: true,
      hireCount: true,
    },
  });

  const apps = await c.var.db.application.findMany({
    where: { tenantId, job: { employerId: userId }, appliedAt: { gte: seasonStart } },
    select: {
      jobId: true,
      status: true,
      appliedAt: true,
      hiredAt: true,
    },
  });

  const hires = apps.filter((a) => a.status === AppStatus.hired).length;

  // Avg time-to-fill (publishedAt → filledAt) for jobs that have filled in window.
  const filled = jobs.filter((j) => j.publishedAt && j.filledAt);
  let avgFillDays: number | null = null;
  if (filled.length > 0) {
    const total = filled.reduce(
      (sum, j) => sum + (j.filledAt!.getTime() - j.publishedAt!.getTime()),
      0,
    );
    avgFillDays = Math.round((total / filled.length / (24 * 60 * 60 * 1000)) * 10) / 10;
  }

  // Group apps by job for by-job-type table.
  const byJob = new Map<string, { applied: number; hired: number }>();
  for (const a of apps) {
    const acc = byJob.get(a.jobId) ?? { applied: 0, hired: 0 };
    acc.applied += 1;
    if (a.status === AppStatus.hired) acc.hired += 1;
    byJob.set(a.jobId, acc);
  }
  const byJobType = jobs
    .map((j) => {
      const stats = byJob.get(j.id) ?? { applied: 0, hired: 0 };
      const fillPct = j.positionsTotal > 0 ? Math.round((j.hireCount / j.positionsTotal) * 100) : 0;
      return { label: j.titleEn, applied: stats.applied, hired: stats.hired, fillPct };
    })
    .sort((a, b) => b.hired - a.hired)
    .slice(0, 10);

  // Weekly applicant flow.
  const seasonFlow = computeWeekly(apps, seasonStart);

  // KPIs.
  const kpis = [
    {
      key: 'hires' as const,
      value: String(hires),
      delta: '',
      sub: `${jobs.filter((j) => j.hireCount > 0).length} job postings`,
    },
    {
      key: 'time_to_fill' as const,
      value: avgFillDays != null ? `${avgFillDays} d` : '—',
      delta: '',
      sub: 'from publish to last hire',
    },
    {
      key: 'cost_per_hire' as const,
      value: '—',
      delta: '',
      sub: 'incl. SMS, broadcast',
    },
    {
      key: 'retention_30d' as const,
      value: '—',
      delta: '',
      sub: '30-day worker retention',
    },
  ];

  // Top performers — by total net pay across payroll lines (when present).
  const topPayroll = await c.var.db.payrollLine.groupBy({
    by: ['workerUserId'],
    where: { tenantId, period: { employerId: userId } },
    _sum: { netCents: true, hours: true },
    orderBy: { _sum: { netCents: 'desc' } },
    take: 5,
  });

  const topWorkers: Array<{
    rank: number;
    workerUserId: string;
    name: string;
    initials: string;
    role: string;
    metric: string;
    delta: string;
  }> = [];
  if (topPayroll.length > 0) {
    const profiles = await c.var.db.workerProfile.findMany({
      where: { id: { in: topPayroll.map((p) => p.workerUserId) } },
      select: { id: true, firstName: true, lastName: true },
    });
    const byUser = new Map(profiles.map((p) => [p.id, p]));
    topPayroll.forEach((p, i) => {
      const wp = byUser.get(p.workerUserId);
      const first = wp?.firstName ?? '';
      const last = wp?.lastName ?? '';
      const net = p._sum.netCents ?? 0;
      const hrs = p._sum.hours ? Number(p._sum.hours.toString()) : 0;
      topWorkers.push({
        rank: i + 1,
        workerUserId: p.workerUserId,
        name: `${first} ${last}`.trim() || '—',
        initials: `${(first[0] ?? '').toUpperCase()}${(last[0] ?? '').toUpperCase()}`,
        role: '',
        metric: `$${(net / 100).toFixed(2)}`,
        delta: hrs > 0 ? `${hrs.toFixed(0)}h` : '',
      });
    });
  }

  return ok(c, {
    kpis,
    byJobType,
    topWorkers,
    seasonFlow,
  });
});

employerReportsRoutes.get('/overview.csv', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const seasonStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  const jobs = await c.var.db.jobPosting.findMany({
    where: { tenantId, employerId: userId, deletedAt: null, createdAt: { gte: seasonStart } },
    select: {
      id: true,
      titleEn: true,
      county: true,
      status: true,
      positionsTotal: true,
      hireCount: true,
      publishedAt: true,
      filledAt: true,
    },
  });

  const apps = await c.var.db.application.findMany({
    where: { tenantId, job: { employerId: userId }, appliedAt: { gte: seasonStart } },
    select: { jobId: true, status: true },
  });

  const byJob = new Map<string, { applied: number; hired: number }>();
  for (const a of apps) {
    const acc = byJob.get(a.jobId) ?? { applied: 0, hired: 0 };
    acc.applied += 1;
    if (a.status === AppStatus.hired) acc.hired += 1;
    byJob.set(a.jobId, acc);
  }

  const rows: string[][] = [
    [
      'job_id',
      'title',
      'county',
      'status',
      'positions_total',
      'hires',
      'applied',
      'fill_pct',
      'published_at',
      'filled_at',
    ],
  ];
  for (const j of jobs) {
    const stats = byJob.get(j.id) ?? { applied: 0, hired: 0 };
    rows.push([
      j.id,
      j.titleEn,
      j.county ?? '',
      j.status,
      String(j.positionsTotal),
      String(stats.hired),
      String(stats.applied),
      j.positionsTotal > 0 ? String(Math.round((j.hireCount / j.positionsTotal) * 100)) : '0',
      j.publishedAt ? j.publishedAt.toISOString() : '',
      j.filledAt ? j.filledAt.toISOString() : '',
    ]);
  }

  const filename = `agconn-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
});

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          return /[,"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\r\n');
}

function computeWeekly(
  apps: { appliedAt: Date; status: string; hiredAt: Date | null }[],
  seasonStart: Date,
) {
  const buckets = new Map<number, { applied: number; hired: number }>();
  for (const a of apps) {
    const week = Math.floor(
      (a.appliedAt.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    const acc = buckets.get(week) ?? { applied: 0, hired: 0 };
    acc.applied += 1;
    if (a.status === 'hired') acc.hired += 1;
    buckets.set(week, acc);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, v]) => ({ week: week + 1, applied: v.applied, hired: v.hired }));
}
