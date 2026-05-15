import { Hono } from 'hono';
import { ok, validate } from '@agconn/api-client/server';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import { csvResponse, rowsToCsv, type CsvColumn } from '../_lib/csv.js';
import { kpiQuery } from './schemas.js';
import { buildKpiSummary, type KpiSummary } from './service.js';

export const adminKpiRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminKpiRoutes.use('*', clerkAdminAuthMiddleware);
adminKpiRoutes.use('*', requireAdminOrg('admin'));

adminKpiRoutes.get('/summary', validate('query', kpiQuery), async (c) => {
  const q = c.var.body;
  const summary = await buildKpiSummary(c.var.db, q);
  return ok(c, summary);
});

type KpiRow = {
  metric: string;
  value: string;
  sublabel: string;
  trendDeltaPct: number | null;
};

function rowsForSummary(s: KpiSummary): KpiRow[] {
  return [
    {
      metric: 'placements_count',
      value: String(s.placements.count),
      sublabel: `unique_workers=${s.placements.uniqueWorkers}; avg_wage=${s.placements.avgWage ?? ''}`,
      trendDeltaPct: s.placements.trend.deltaPct,
    },
    {
      metric: 'training_completed',
      value: String(s.training.completedCount),
      sublabel: `certs=${s.training.certCount}; unique_workers=${s.training.uniqueWorkers}`,
      trendDeltaPct: s.training.trend.deltaPct,
    },
    {
      metric: 'employers_active',
      value: String(s.employers.activeCount),
      sublabel: `postings=${s.employers.postingsCount}; hire_rate=${s.employers.hireRate ?? ''}`,
      trendDeltaPct: s.employers.trend.deltaPct,
    },
    {
      metric: 'wages_median',
      value: s.wages.median?.toString() ?? '',
      sublabel: `p10=${s.wages.p10 ?? ''}; p90=${s.wages.p90 ?? ''}`,
      trendDeltaPct: null,
    },
  ];
}

const kpiColumns: CsvColumn<KpiRow>[] = [
  { header: 'metric', value: (r) => r.metric },
  { header: 'value', value: (r) => r.value },
  { header: 'sublabel', value: (r) => r.sublabel },
  {
    header: 'trend_delta_pct',
    value: (r) => (r.trendDeltaPct == null ? '' : r.trendDeltaPct.toFixed(2)),
  },
];

adminKpiRoutes.get('/export.csv', validate('query', kpiQuery), async (c) => {
  const q = c.var.body;
  const summary = await buildKpiSummary(c.var.db, q);
  const rows = rowsForSummary(summary);
  const csv = rowsToCsv(rows, kpiColumns);

  await c.var.audit.log({
    action: 'admin.data.exported',
    metadata: { exportType: 'kpi.summary', start: q.start, end: q.end },
  });

  return csvResponse(c, `kpi-${q.start}-${q.end}.csv`, csv);
});
