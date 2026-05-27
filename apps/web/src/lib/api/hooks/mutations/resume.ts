'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';
import { qk } from '../../query-keys';

export type ReuploadResult =
  | { ok: true; status: 'parsing'; pollUrl: string }
  | { ok: false; code: string; message: string };

export type ParseStatus =
  | { ok: true; status: 'parsing' | 'parsed'; resume?: unknown }
  | { ok: true; status: 'failed'; reason: string; fallback: 'manual_entry' }
  | { ok: false; code: string; message: string };

export function useStartResumeReuploadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<ReuploadResult> => {
      const res = await apiClient().post<{ status: 'parsing'; poll_url: string }>(
        '/v1/profile/resume/reupload',
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, status: res.data.status, pollUrl: res.data.poll_url };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.profile() });
    },
  });
}

async function fetchResumeStatus(): Promise<ParseStatus> {
  const res = await apiClient().get<
    | { status: 'parsing' }
    | { status: 'parsed'; resume: unknown }
    | { status: 'failed'; reason: string; fallback: 'manual_entry' }
  >('/v1/profile/resume/status', { handleErrorInline: true });
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  if (res.data.status === 'failed') {
    return { ok: true, status: 'failed', reason: res.data.reason, fallback: res.data.fallback };
  }
  if (res.data.status === 'parsed') {
    return { ok: true, status: 'parsed', resume: res.data.resume };
  }
  return { ok: true, status: 'parsing' };
}

// Active polling while the user waits for parser completion. Stops once
// parsed/failed; callers gate enablement so it doesn't run on every mount.
export function useResumeStatusQuery(options?: { enabled?: boolean; intervalMs?: number }) {
  const enabled = options?.enabled ?? false;
  const intervalMs = options?.intervalMs ?? 1500;
  return useQuery({
    queryKey: [...qk.profile(), 'resume-status'] as const,
    queryFn: fetchResumeStatus,
    enabled,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return intervalMs;
      if (!d.ok) return false;
      if (d.status === 'parsing') return intervalMs;
      return false;
    },
  });
}
