'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';

export type TrainingOrgResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export type UpdateProgramInput = {
  descriptionEn?: string;
  descriptionEs?: string;
  locationName?: string;
  locationAddress?: string;
  sessionTimes?: { start: string; end: string; notes?: string }[];
};

export function useUpdateProgramMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      body: UpdateProgramInput;
    }): Promise<TrainingOrgResult<null>> => {
      const res = await apiClient().patch(
        `/v1/org/training/${encodeURIComponent(input.id)}`,
        input.body,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: null };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: ['training-org'] });
    },
  });
}

export function useCancelProgramMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      reason?: string;
    }): Promise<TrainingOrgResult<{ notified: number }>> => {
      const res = await apiClient().post<{ ok: boolean; notified: number }>(
        `/v1/org/training/${encodeURIComponent(input.id)}/cancel`,
        { reason: input.reason ?? undefined },
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { notified: res.data.notified } };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: ['training-org'] });
    },
  });
}

export function useBulkUpdateEnrollmentsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      programId: string;
      enrollmentIds: string[];
      status: 'completed' | 'dropped';
      noShow?: boolean;
    }): Promise<TrainingOrgResult<{ updated: number }>> => {
      const res = await apiClient().patch<{ ok: boolean; updated: number }>(
        `/v1/org/training/${encodeURIComponent(input.programId)}/enrollments`,
        {
          enrollmentIds: input.enrollmentIds,
          status: input.status,
          noShow: input.noShow,
        },
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { updated: res.data.updated } };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: ['training-org'] });
    },
  });
}
