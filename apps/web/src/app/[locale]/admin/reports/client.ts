import 'server-only';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_BEARER_TOKEN ?? '';

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

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const adminFetch = async <T>(path: string, init?: RequestInit): Promise<Envelope<T>> => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${ADMIN_TOKEN}`,
      'accept-language': 'en',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  return (await res.json().catch(() => ({
    ok: false,
    error: { code: 'internal_error', message: 'parse failed' },
  }))) as Envelope<T>;
};

export const fetchPlacementPreview = (qs: string) =>
  adminFetch<PreviewResponse>(`/admin/v1/reports/placement/preview${qs ? `?${qs}` : ''}`);

export const fetchReportRuns = (qs: string) =>
  adminFetch<{ runs: ReportRunWithArchive[] }>(`/admin/v1/reports/runs${qs ? `?${qs}` : ''}`);
