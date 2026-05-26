'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; fields?: Record<string, string> };

export type OnboardingPatch = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  zipCode?: string | null;
  county?: string | null;
  skills?: string[];
  availability?: Record<string, unknown>;
};

export async function patchOnboardingAction(
  body: OnboardingPatch,
): Promise<ActionResult<{ next_step: string }>> {
  const api = await getServerApiClient();
  const res = await api.patch<{ user: unknown; profile: unknown; next_step: string }>(
    '/v1/onboarding/profile',
    body,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return {
      ok: false,
      code: res.error.code,
      message: res.error.message,
      fields: res.error.fields,
    };
  }
  revalidatePath('/[locale]/field/onboarding', 'layout');
  return { ok: true, data: { next_step: res.data.next_step } };
}

export async function setLanguageAction(
  lang: 'en' | 'es',
): Promise<ActionResult<null>> {
  const api = await getServerApiClient();
  const res = await api.patch('/v1/onboarding/language', { lang }, {
    handleErrorInline: true,
  });
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  return { ok: true, data: null };
}

export async function completeOnboardingAction(): Promise<ActionResult<{
  redirect: string;
}>> {
  const api = await getServerApiClient();
  const res = await api.post<{ status: string; redirect: string }>(
    '/v1/onboarding/complete',
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]', 'layout');
  return { ok: true, data: { redirect: res.data.redirect } };
}
