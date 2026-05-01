'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';
import { expandAvailability } from './profile';

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

export type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string; conflict?: boolean };

export async function savePatchAction(input: ProfilePatchInput): Promise<ActionResult> {
  const api = await getServerApiClient();
  const { availability, ...rest } = input;
  const body: Record<string, unknown> = { ...rest };
  if (availability) {
    body.availability = expandAvailability({
      weekdays: Boolean(availability.weekdays),
      weekends: Boolean(availability.weekends),
    });
  }
  const res = await api.patch('/v1/profile', body, { handleErrorInline: true });
  if (!res.ok) {
    return {
      ok: false,
      code: res.error.code,
      message: res.error.message,
      conflict: res.error.code === 'conflict',
    };
  }
  revalidatePath('/[locale]/worker/profile', 'page');
  return { ok: true };
}

export type ResumeSection = 'experience' | 'education' | 'certifications';

export async function addResumeItemAction(
  section: ResumeSection,
  item: { primary: string; secondary?: string; meta?: string },
): Promise<ActionResult> {
  const api = await getServerApiClient();
  const res = await api.post(`/v1/profile/resume/${section}`, item, {
    handleErrorInline: true,
  });
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/worker/profile', 'page');
  return { ok: true };
}

export async function removeResumeItemAction(
  section: ResumeSection,
  index: number,
): Promise<ActionResult> {
  const api = await getServerApiClient();
  const res = await api.del(`/v1/profile/resume/${section}/${index}`, {
    handleErrorInline: true,
  });
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/worker/profile', 'page');
  return { ok: true };
}
