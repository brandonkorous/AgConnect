'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';
import { qk } from '../../query-keys';

export type OnboardingPatch = {
  firstName?: string;
  lastName?: string;
  email?: string;
  zipCode?: string;
  county?: string;
  skills?: string[];
  availability?: Record<string, unknown>;
};

export type OnboardingPatchResult =
  | { ok: true; data: { next_step: string } }
  | { ok: false; code: string; message: string; fields?: Record<string, string> };

export type SetLanguageResult =
  | { ok: true; data: null }
  | { ok: false; code: string; message: string };

export type CompleteOnboardingResult =
  | { ok: true; data: { redirect: string } }
  | { ok: false; code: string; message: string };

export function usePatchOnboardingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: OnboardingPatch): Promise<OnboardingPatchResult> => {
      const res = await apiClient().patch<{
        user: unknown;
        profile: unknown;
        next_step: string;
      }>('/v1/onboarding/profile', body, { handleErrorInline: true });
      if (!res.ok) {
        return {
          ok: false,
          code: res.error.code,
          message: res.error.message,
          fields: res.error.fields,
        };
      }
      return { ok: true, data: { next_step: res.data.next_step } };
    },
    onSuccess: (r) => {
      if (!r.ok) return;
      void qc.invalidateQueries({ queryKey: qk.onboardingDraft() });
      void qc.invalidateQueries({ queryKey: qk.me() });
    },
  });
}

export function useSetLanguageMutation() {
  return useMutation({
    mutationFn: async (lang: 'en' | 'es'): Promise<SetLanguageResult> => {
      const res = await apiClient().patch('/v1/onboarding/language', { lang }, {
        handleErrorInline: true,
      });
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: null };
    },
  });
}

export function useCompleteOnboardingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<CompleteOnboardingResult> => {
      const res = await apiClient().post<{ status: string; redirect: string }>(
        '/v1/onboarding/complete',
        undefined,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: { redirect: res.data.redirect } };
    },
    onSuccess: (r) => {
      if (!r.ok) return;
      void qc.invalidateQueries({ queryKey: qk.me() });
      void qc.invalidateQueries({ queryKey: qk.profile() });
    },
  });
}
