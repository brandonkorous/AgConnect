'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export async function applyToJobAction(
  jobId: string,
): Promise<ActionResult<{ applicationId: string }>> {
  const api = await getServerApiClient();
  const res = await api.post<{ application: { id: string } }>(
    `/v1/jobs/${encodeURIComponent(jobId)}/apply`,
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/worker/applications', 'page');
  revalidatePath(`/[locale]/worker/jobs`, 'page');
  return { ok: true, data: { applicationId: res.data.application.id } };
}

export async function withdrawApplicationAction(
  applicationId: string,
): Promise<ActionResult<null>> {
  const api = await getServerApiClient();
  const res = await api.post(
    `/v1/applications/${encodeURIComponent(applicationId)}/withdraw`,
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/worker/applications', 'page');
  return { ok: true, data: null };
}
