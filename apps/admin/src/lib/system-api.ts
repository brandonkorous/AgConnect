import 'server-only';
import { adminFetch } from './api-server';

// ─── feature flags ──────────────────────────────────────────────────────────

export type FlagMatrix = {
  flags: {
    key: string;
    label: string;
    platform: { id: string; enabled: boolean; notes: string | null; updatedAt: string } | null;
    tenantOverrides: {
      id: string;
      tenantId: string;
      tenantSlug: string;
      tenantName: string;
      enabled: boolean;
      notes: string | null;
      updatedAt: string;
    }[];
  }[];
  tenants: { id: string; slug: string; name: string }[];
};

export const fetchFlags = () => adminFetch<FlagMatrix>('/admin/v1/system/flags');

export const upsertFlag = (body: {
  key: string;
  tenantId: string | null;
  enabled: boolean;
  notes?: string | null;
}) => adminFetch('/admin/v1/system/flags', { method: 'PUT', body });

export const deleteFlag = (id: string) =>
  adminFetch(`/admin/v1/system/flags/${id}`, { method: 'DELETE' });

// ─── jobs (pg-boss) ─────────────────────────────────────────────────────────

export type QueueRow = {
  name: string;
  pending: number;
  retry: number;
  active: number;
  failed: number;
  oldestPending: string | null;
};

export type JobRow = {
  id: string;
  queue: string;
  state: string;
  retryCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  data: unknown;
  output: unknown;
};

export const fetchQueues = () => adminFetch<{ queues: QueueRow[] }>('/admin/v1/system/jobs/queues');

export const fetchRecentJobs = (params: { queue?: string; state?: 'failed' | 'retry' | 'active'; limit?: number }) =>
  adminFetch<{ jobs: JobRow[] }>('/admin/v1/system/jobs/recent', { query: params });

export const replayJob = (id: string) =>
  adminFetch<{ replayedAs: string | null }>('/admin/v1/system/jobs/replay', {
    method: 'POST',
    body: { id },
  });

// ─── health ─────────────────────────────────────────────────────────────────

export type HealthBoard = {
  services: {
    name: string;
    description: string;
    url: string | null;
    ping: { status: 'ok' | 'degraded' | 'down' | 'unknown'; latencyMs: number | null; error: string | null };
    lastActivity: { at: string | null; what: string };
  }[];
  env: { node: string; nodeEnv: string; gitSha: string | null; region: string | null };
  checkedAt: string;
};

export const fetchHealth = () => adminFetch<HealthBoard>('/admin/v1/system/health');

// ─── lookups ────────────────────────────────────────────────────────────────

export type LookupTable = 'crops' | 'role-types' | 'skill-tags';
export type LookupRow = {
  id: string;
  slug: string;
  labelEn: string;
  labelEs: string;
  sortOrder: number;
  active: boolean;
  glyphKey?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
};

export const fetchLookup = (table: LookupTable) =>
  adminFetch<{ rows: LookupRow[] }>(`/admin/v1/system/lookups/${table}`);

export const createLookupRow = (table: LookupTable, body: Record<string, unknown>) =>
  adminFetch(`/admin/v1/system/lookups/${table}`, { method: 'POST', body });

export const updateLookupRow = (table: LookupTable, id: string, body: Record<string, unknown>) =>
  adminFetch(`/admin/v1/system/lookups/${table}/${id}`, { method: 'PATCH', body });

export const deleteLookupRow = (table: LookupTable, id: string) =>
  adminFetch(`/admin/v1/system/lookups/${table}/${id}`, { method: 'DELETE' });

// ─── AEWR rates ─────────────────────────────────────────────────────────────

export type AewrRow = {
  id: string;
  stateCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  hourlyCents: number;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export const fetchAewr = (stateCode?: string) =>
  adminFetch<{ rates: AewrRow[] }>('/admin/v1/system/aewr', {
    query: stateCode ? { stateCode } : undefined,
  });

export const createAewr = (body: {
  stateCode: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  hourlyCents: number;
  source?: string | null;
}) => adminFetch('/admin/v1/system/aewr', { method: 'POST', body });

export const updateAewr = (
  id: string,
  body: { effectiveTo?: string | null; hourlyCents?: number; source?: string | null },
) => adminFetch(`/admin/v1/system/aewr/${id}`, { method: 'PATCH', body });

export const deleteAewr = (id: string) =>
  adminFetch(`/admin/v1/system/aewr/${id}`, { method: 'DELETE' });
