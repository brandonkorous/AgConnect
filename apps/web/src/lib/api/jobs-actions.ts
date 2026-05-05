'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export async function discardDraftJobAction(
  jobId: string,
): Promise<ActionResult<null>> {
  const api = await getServerApiClient();
  const res = await api.del(`/v1/employer/jobs/${encodeURIComponent(jobId)}`, {
    handleErrorInline: true,
  });
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/employer/jobs', 'page');
  return { ok: true, data: null };
}

export async function closeJobPostingAction(
  jobId: string,
): Promise<ActionResult<null>> {
  const api = await getServerApiClient();
  const res = await api.post(
    `/v1/employer/jobs/${encodeURIComponent(jobId)}/close`,
    {},
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/employer/jobs', 'page');
  return { ok: true, data: null };
}

export async function setJobRenotifyPausedAction(
  jobId: string,
  paused: boolean,
): Promise<ActionResult<{ renotifyPaused: boolean }>> {
  const api = await getServerApiClient();
  const path = paused ? 'pause-renotify' : 'resume-renotify';
  const res = await api.post<{ renotifyPaused: boolean }>(
    `/v1/employer/jobs/${encodeURIComponent(jobId)}/${path}`,
    {},
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  revalidatePath('/[locale]/employer/jobs', 'page');
  return { ok: true, data: res.data };
}
