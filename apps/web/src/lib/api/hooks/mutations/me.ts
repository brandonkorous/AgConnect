'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';
import { qk } from '../../query-keys';

export type MeActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export function useConfirmShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string): Promise<MeActionResult<{ status: string }>> => {
      const res = await apiClient().post<{ status: string }>(
        `/v1/me/shifts/${encodeURIComponent(assignmentId)}/confirm`,
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { status: res.data.status } };
    },
    onSuccess: (r) => {
      if (!r.ok) return;
      void qc.invalidateQueries({ queryKey: qk.myShifts() });
      void qc.invalidateQueries({ queryKey: qk.myNavCounts() });
    },
  });
}

export function useDeclineShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string): Promise<MeActionResult<{ status: string }>> => {
      const res = await apiClient().post<{ status: string }>(
        `/v1/me/shifts/${encodeURIComponent(assignmentId)}/decline`,
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { status: res.data.status } };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.myShifts() });
    },
  });
}

export function useArriveAtShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string): Promise<MeActionResult<{ arrivedAt: string }>> => {
      const res = await apiClient().post<{ arrivedAt: string }>(
        `/v1/me/shifts/${encodeURIComponent(assignmentId)}/arrive`,
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { arrivedAt: res.data.arrivedAt } };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.myShifts() });
    },
  });
}

export function useSendMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      conversationId: string;
      body: string;
    }): Promise<MeActionResult<{ id: string }>> => {
      const res = await apiClient().post<{ id: string }>(
        `/v1/me/messages/${encodeURIComponent(input.conversationId)}/send`,
        { body: input.body },
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { id: res.data.id } };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.myMessageThreads() });
    },
  });
}

export function useMarkAllMessagesReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<MeActionResult<{ marked: number }>> => {
      const res = await apiClient().post<{ marked: number }>(
        '/v1/me/messages/read-all',
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { marked: res.data.marked } };
    },
    onSuccess: (r) => {
      if (!r.ok) return;
      void qc.invalidateQueries({ queryKey: qk.myMessageThreads() });
      void qc.invalidateQueries({ queryKey: qk.myNavCounts() });
    },
  });
}
