'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';
import { qk } from '../../query-keys';

export type ApplyResult =
  | { ok: true; data: { applicationId: string } }
  | { ok: false; code: string; message: string };

export type SimpleResult =
  | { ok: true; data: null }
  | { ok: false; code: string; message: string };

export function useApplyToJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string): Promise<ApplyResult> => {
      const res = await apiClient().post<{ application: { id: string } }>(
        `/v1/jobs/${encodeURIComponent(jobId)}/apply`,
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { applicationId: res.data.application.id } };
    },
    onSuccess: (result) => {
      if (!result.ok) return;
      void qc.invalidateQueries({ queryKey: qk.applications() });
      void qc.invalidateQueries({ queryKey: qk.jobs() });
      void qc.invalidateQueries({ queryKey: qk.recommendedJobs() });
    },
  });
}

export function useWithdrawApplicationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string): Promise<SimpleResult> => {
      const res = await apiClient().post(
        `/v1/applications/${encodeURIComponent(applicationId)}/withdraw`,
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: null };
    },
    onSuccess: (result) => {
      if (!result.ok) return;
      void qc.invalidateQueries({ queryKey: qk.applications() });
    },
  });
}
