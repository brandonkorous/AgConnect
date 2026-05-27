'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';
import { qk } from '../../query-keys';

export type JobActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export function useDiscardDraftJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string): Promise<JobActionResult> => {
      const res = await apiClient().del(`/v1/employer/jobs/${encodeURIComponent(jobId)}`, {
        handleErrorInline: true,
      });
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: null };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: ['employer'] });
    },
  });
}

export function useCloseJobPostingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string): Promise<JobActionResult> => {
      const res = await apiClient().post(
        `/v1/employer/jobs/${encodeURIComponent(jobId)}/close`,
        {},
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: null };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: ['employer'] });
    },
  });
}

export function useSetJobRenotifyPausedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      jobId: string;
      paused: boolean;
    }): Promise<JobActionResult<{ renotifyPaused: boolean }>> => {
      const path = input.paused ? 'pause-renotify' : 'resume-renotify';
      const res = await apiClient().post<{ renotifyPaused: boolean }>(
        `/v1/employer/jobs/${encodeURIComponent(input.jobId)}/${path}`,
        {},
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: res.data };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: ['employer'] });
    },
  });
}
