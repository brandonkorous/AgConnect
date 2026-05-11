import 'server-only';
import { adminFetch } from './api-server';

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

export type KpiQuery = {
  tenantIds?: string[];
  counties?: string[];
  start: string;
  end: string;
};

export const fetchKpiSummary = (q: KpiQuery, tenantId: string | null = null) =>
  adminFetch<KpiSummary>('/admin/v1/kpi/summary', {
    query: {
      tenantIds: q.tenantIds,
      counties: q.counties,
      start: q.start,
      end: q.end,
    },
    tenantId,
  });
