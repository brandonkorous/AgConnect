'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';

export type TrainingResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export function useEnrollInProgramMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      programId: string,
    ): Promise<TrainingResult<{ enrollmentId: string }>> => {
      const res = await apiClient().post<{ enrollment: { id: string } }>(
        `/v1/training/${encodeURIComponent(programId)}/enroll`,
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { enrollmentId: res.data.enrollment.id } };
    },
    onSuccess: (r) => {
      if (!r.ok) return;
      void qc.invalidateQueries({ queryKey: ['training'] });
      void qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useUnenrollFromProgramMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string): Promise<TrainingResult<null>> => {
      const res = await apiClient().post(
        `/v1/training/${encodeURIComponent(programId)}/unenroll`,
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: null };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: ['training'] });
    },
  });
}
