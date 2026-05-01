import { z } from 'zod';

export const ReportsRangeEnum = z.enum(['current', 'prev']);
export type ReportsRange = z.infer<typeof ReportsRangeEnum>;

export const ReportsOverviewQuery = z
  .object({
    season: ReportsRangeEnum.default('current'),
  })
  .strict();
export type ReportsOverviewQuery = z.infer<typeof ReportsOverviewQuery>;

export const ReportsKpiSchema = z.object({
  key: z.enum(['hires', 'time_to_fill', 'cost_per_hire', 'retention_30d']),
  value: z.string(),
  delta: z.string(),
  sub: z.string(),
});
export type ReportsKpiView = z.infer<typeof ReportsKpiSchema>;

export const ReportsByJobTypeSchema = z.object({
  label: z.string(),
  applied: z.number().int().nonnegative(),
  hired: z.number().int().nonnegative(),
  fillPct: z.number().min(0).max(100),
});
export type ReportsByJobTypeView = z.infer<typeof ReportsByJobTypeSchema>;

export const ReportsTopWorkerSchema = z.object({
  rank: z.number().int().min(1),
  workerUserId: z.string(),
  name: z.string(),
  initials: z.string(),
  role: z.string(),
  metric: z.string(),
  delta: z.string(),
});
export type ReportsTopWorkerView = z.infer<typeof ReportsTopWorkerSchema>;

export const ReportsSeasonFlowPointSchema = z.object({
  week: z.number().int().min(1),
  applied: z.number().int().nonnegative(),
  hired: z.number().int().nonnegative(),
});
export type ReportsSeasonFlowPoint = z.infer<typeof ReportsSeasonFlowPointSchema>;

export const ReportsOverviewSchema = z.object({
  kpis: z.array(ReportsKpiSchema),
  byJobType: z.array(ReportsByJobTypeSchema),
  topWorkers: z.array(ReportsTopWorkerSchema),
  seasonFlow: z.array(ReportsSeasonFlowPointSchema),
});
export type ReportsOverviewView = z.infer<typeof ReportsOverviewSchema>;
