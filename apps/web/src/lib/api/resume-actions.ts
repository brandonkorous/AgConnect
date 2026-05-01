'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';

export type ReuploadResult =
  | { ok: true; status: 'parsing'; pollUrl: string }
  | { ok: false; code: string; message: string };

export async function startResumeReuploadAction(): Promise<ReuploadResult> {
  const api = await getServerApiClient();
  const res = await api.post<{ status: 'parsing'; poll_url: string }>(
    '/v1/profile/resume/reupload',
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/worker/profile', 'page');
  return { ok: true, status: res.data.status, pollUrl: res.data.poll_url };
}

export type ParseStatus =
  | { ok: true; status: 'parsing' | 'parsed'; resume?: unknown }
  | {
      ok: true;
      status: 'failed';
      reason: string;
      fallback: 'manual_entry';
    }
  | { ok: false; code: string; message: string };

export async function pollResumeStatusAction(): Promise<ParseStatus> {
  const api = await getServerApiClient();
  const res = await api.get<
    | { status: 'parsing' }
    | { status: 'parsed'; resume: unknown }
    | { status: 'failed'; reason: string; fallback: 'manual_entry' }
  >('/v1/profile/resume/status', { handleErrorInline: true });
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  if (res.data.status === 'failed') {
    return { ok: true, status: 'failed', reason: res.data.reason, fallback: res.data.fallback };
  }
  if (res.data.status === 'parsed') {
    return { ok: true, status: 'parsed', resume: res.data.resume };
  }
  return { ok: true, status: 'parsing' };
}
