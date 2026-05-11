import 'server-only';
import { adminFetch } from './api-server';

export type PreviewRow = Record<string, string | number | null>;

export type PreviewResponse = {
  rows: PreviewRow[];
  totalCount: number;
  columns: string[];
};

export type ReportRun = {
  id: string;
  tenantId: string | null;
  reportType: string;
  filters: Record<string, unknown>;
  rowCount: number;
  format: string;
  generatedBy: string;
  generatedAt: string;
};

export type ReportRunWithArchive = ReportRun & { hasArchive: boolean };

export const fetchPlacementPreview = (qs: string) =>
  adminFetch<PreviewResponse>(`/admin/v1/reports/placement/preview${qs ? `?${qs}` : ''}`);

export const fetchReportRuns = (qs: string) =>
  adminFetch<{ runs: ReportRunWithArchive[] }>(
    `/admin/v1/reports/runs${qs ? `?${qs}` : ''}`,
  );
