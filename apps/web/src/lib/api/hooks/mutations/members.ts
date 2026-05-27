'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MemberInput, MemberPatch } from '@agconn/schemas';
import { apiClient } from '../../client';
import { qk } from '../../query-keys';

export type MemberActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export type AcceptInviteResult =
  | { ok: true; employerId: string; employerName: string; roleKey: string }
  | { ok: false; code: string; message: string };

function fail(res: { error: { code: string; message: string } }): MemberActionResult {
  return { ok: false, code: res.error.code, message: res.error.message };
}

function invalidateTeam(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.employer.members() });
  void qc.invalidateQueries({ queryKey: ['employer'] });
}

export function useCreateMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MemberInput): Promise<MemberActionResult> => {
      const res = await apiClient().post('/v1/employer/members', input, {
        handleErrorInline: true,
      });
      if (!res.ok) return fail(res);
      return { ok: true };
    },
    onSuccess: (r) => {
      if (r.ok) invalidateTeam(qc);
    },
  });
}

export function usePatchMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: MemberPatch;
    }): Promise<MemberActionResult> => {
      const res = await apiClient().patch(`/v1/employer/members/${input.id}`, input.patch, {
        handleErrorInline: true,
      });
      if (!res.ok) return fail(res);
      return { ok: true };
    },
    onSuccess: (r) => {
      if (r.ok) invalidateTeam(qc);
    },
  });
}

export function useDeleteMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<MemberActionResult> => {
      const res = await apiClient().del(`/v1/employer/members/${id}`, {
        handleErrorInline: true,
      });
      if (!res.ok) return fail(res);
      return { ok: true };
    },
    onSuccess: (r) => {
      if (r.ok) invalidateTeam(qc);
    },
  });
}

export function useResendInviteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<MemberActionResult> => {
      const res = await apiClient().post(`/v1/employer/members/${id}/invite`, undefined, {
        handleErrorInline: true,
      });
      if (!res.ok) return fail(res);
      return { ok: true };
    },
    onSuccess: (r) => {
      if (r.ok) invalidateTeam(qc);
    },
  });
}

export function useTransferOwnerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string): Promise<MemberActionResult> => {
      const res = await apiClient().post(
        '/v1/employer/members/transfer-owner',
        { contactId },
        { handleErrorInline: true },
      );
      if (!res.ok) return fail(res);
      return { ok: true };
    },
    onSuccess: (r) => {
      if (r.ok) invalidateTeam(qc);
    },
  });
}

export function useAcceptInviteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string): Promise<AcceptInviteResult> => {
      const res = await apiClient().post<{
        employerId: string;
        employerName: string;
        roleKey: string;
      }>(`/v1/me/employer-invitations/${encodeURIComponent(token)}/accept`, undefined, {
        handleErrorInline: true,
      });
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return {
        ok: true,
        employerId: res.data.employerId,
        employerName: res.data.employerName,
        roleKey: res.data.roleKey,
      };
    },
    onSuccess: (r) => {
      if (!r.ok) return;
      void qc.invalidateQueries({ queryKey: qk.me() });
      void qc.invalidateQueries({ queryKey: ['employer'] });
    },
  });
}
