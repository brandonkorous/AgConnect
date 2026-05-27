'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';
import { qk } from '../../query-keys';

export type ProfilePatchInput = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  zipCode?: string | null;
  county?: string | null;
  skills?: string[];
  availability?: { weekdays?: boolean; weekends?: boolean };
  expectedUpdatedAt?: string;
};

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string; conflict?: boolean };

export type ResumeSection = 'experience' | 'education' | 'certifications';

function expandAvailability(flags: { weekdays?: boolean; weekends?: boolean }) {
  const weekday = flags.weekdays ? { am: true, pm: true } : { am: false, pm: false };
  const weekend = flags.weekends ? { am: true, pm: true } : { am: false, pm: false };
  return {
    mon: weekday,
    tue: weekday,
    wed: weekday,
    thu: weekday,
    fri: weekday,
    sat: weekend,
    sun: weekend,
  };
}

export function useSaveProfilePatchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfilePatchInput): Promise<ProfileActionResult> => {
      const { availability, ...rest } = input;
      const body: Record<string, unknown> = { ...rest };
      if (availability) {
        body.availability = expandAvailability({
          weekdays: Boolean(availability.weekdays),
          weekends: Boolean(availability.weekends),
        });
      }
      const res = await apiClient().patch('/v1/profile', body, { handleErrorInline: true });
      if (!res.ok) {
        return {
          ok: false,
          code: res.error.code,
          message: res.error.message,
          conflict: res.error.code === 'conflict',
        };
      }
      return { ok: true };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.profile() });
    },
  });
}

export function useAddResumeItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      section: ResumeSection;
      item: { primary: string; secondary?: string; meta?: string };
    }): Promise<ProfileActionResult> => {
      const res = await apiClient().post(`/v1/profile/resume/${input.section}`, input.item, {
        handleErrorInline: true,
      });
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.profile() });
    },
  });
}

export function useRemoveResumeItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      section: ResumeSection;
      index: number;
    }): Promise<ProfileActionResult> => {
      const res = await apiClient().del(
        `/v1/profile/resume/${input.section}/${input.index}`,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.profile() });
    },
  });
}
