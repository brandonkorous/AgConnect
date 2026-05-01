'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export async function enrollInProgramAction(
  programId: string,
): Promise<ActionResult<{ enrollmentId: string }>> {
  const api = await getServerApiClient();
  const res = await api.post<{ enrollment: { id: string } }>(
    `/v1/training/${encodeURIComponent(programId)}/enroll`,
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/worker/training', 'page');
  revalidatePath('/[locale]/worker/wallet', 'page');
  return { ok: true, data: { enrollmentId: res.data.enrollment.id } };
}

export async function unenrollFromProgramAction(
  programId: string,
): Promise<ActionResult<null>> {
  const api = await getServerApiClient();
  const res = await api.post(
    `/v1/training/${encodeURIComponent(programId)}/unenroll`,
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/worker/training', 'page');
  return { ok: true, data: null };
}
