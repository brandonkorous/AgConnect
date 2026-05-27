'use client';

// Client-side API helpers for the JobForm. Centralized here so the section
// components stay free of fetch logic — they take callbacks instead.

import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import type {
  EmployerJobView,
  JobPhotoView,
  JobScreeningQuestionView,
} from '@/lib/api/hooks/employer';

type Locale = 'en' | 'es';
const client = (l: string) => getApiClient(l === 'es' ? 'es' : 'en');

export type EditMeta = {
  changedFields: string[];
  renotificationsQueued: number;
  renotificationsSuppressed?: boolean;
  suppressedRecipientCount?: number;
};

export type SaveResult =
  | { kind: 'ok'; job: EmployerJobView; edit?: EditMeta }
  | { kind: 'error'; code: string; message: string; fields?: Record<string, string> };

export async function createJob(locale: string, body: Record<string, unknown>): Promise<SaveResult> {
  const res = await client(locale).post<{ job: EmployerJobView }>('/v1/employer/jobs', body, {
    handleErrorInline: true,
  });
  if (!isOk(res)) {
    return { kind: 'error', code: res.error.code, message: res.error.message, fields: res.error.fields };
  }
  return { kind: 'ok', job: res.data.job };
}

export async function patchJob(
  locale: string,
  id: string,
  body: Record<string, unknown>,
): Promise<SaveResult> {
  const res = await client(locale).patch<{
    job: EmployerJobView;
    edit?: EditMeta;
  }>(`/v1/employer/jobs/${id}`, body, { handleErrorInline: true });
  if (!isOk(res)) {
    return { kind: 'error', code: res.error.code, message: res.error.message, fields: res.error.fields };
  }
  return { kind: 'ok', job: res.data.job, edit: res.data.edit };
}

export async function autosaveJob(
  locale: string,
  id: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; autosavedAt: string | null }> {
  const res = await client(locale).post<{ id: string; autosavedAt: string | null }>(
    `/v1/employer/jobs/${id}/autosave`,
    body,
    { handleErrorInline: true },
  );
  if (!isOk(res)) return { ok: false, autosavedAt: null };
  return { ok: true, autosavedAt: res.data.autosavedAt };
}

export async function closeJob(
  locale: string,
  id: string,
  reason?: 'filled' | 'expired' | 'changed_mind',
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const res = await client(locale).post<{ job: EmployerJobView }>(
    `/v1/employer/jobs/${id}/close`,
    reason ? { reason } : undefined,
    { handleErrorInline: true },
  );
  if (!isOk(res)) return { ok: false, code: res.error.code, message: res.error.message };
  return { ok: true };
}

export async function publishJob(
  locale: string,
  id: string,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const res = await client(locale).post<{ job: EmployerJobView }>(
    `/v1/employer/jobs/${id}/publish`,
    undefined,
    { handleErrorInline: true },
  );
  if (!isOk(res)) return { ok: false, code: res.error.code, message: res.error.message };
  return { ok: true };
}

export async function republishJob(
  locale: string,
  id: string,
): Promise<{ ok: true; enqueued: boolean } | { ok: false; code: string; message: string }> {
  const res = await client(locale).post<{ ok: true; enqueued: boolean }>(
    `/v1/employer/jobs/${id}/republish`,
    undefined,
    { handleErrorInline: true },
  );
  if (!isOk(res)) return { ok: false, code: res.error.code, message: res.error.message };
  return { ok: true, enqueued: res.data.enqueued };
}

export async function reopenJob(
  locale: string,
  id: string,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const res = await client(locale).post<{ job: EmployerJobView }>(
    `/v1/employer/jobs/${id}/reopen`,
    undefined,
    { handleErrorInline: true },
  );
  if (!isOk(res)) return { ok: false, code: res.error.code, message: res.error.message };
  return { ok: true };
}

export async function setJobRenotifyPaused(
  locale: string,
  id: string,
  paused: boolean,
): Promise<{ ok: true; renotifyPaused: boolean } | { ok: false; code: string; message: string }> {
  const path = paused ? 'pause-renotify' : 'resume-renotify';
  const res = await client(locale).post<{ renotifyPaused: boolean }>(
    `/v1/employer/jobs/${id}/${path}`,
    undefined,
    { handleErrorInline: true },
  );
  if (!isOk(res)) return { ok: false, code: res.error.code, message: res.error.message };
  return { ok: true, renotifyPaused: res.data.renotifyPaused };
}

export async function uploadJobPhoto(
  locale: Locale | string,
  jobId: string,
  file: File,
): Promise<JobPhotoView | null> {
  const formData = new FormData();
  formData.append('file', file);
  // The api-client doesn't help with multipart; do it directly so headers stay
  // browser-set (Content-Type with boundary).
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/v1/employer/jobs/${jobId}/photos`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept-Language': locale === 'es' ? 'es' : 'en' },
    body: formData,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { photo: JobPhotoView } };
  return json.data?.photo ?? null;
}

export async function deleteJobPhoto(
  locale: string,
  jobId: string,
  photoId: string,
): Promise<boolean> {
  // api-client doesn't expose DELETE; fall back to fetch.
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/v1/employer/jobs/${jobId}/photos/${photoId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept-Language': locale === 'es' ? 'es' : 'en' },
  });
  return res.ok;
}

export async function reorderJobPhotos(
  locale: string,
  jobId: string,
  order: string[],
): Promise<boolean> {
  const res = await client(locale).put<{ ok: boolean }>(
    `/v1/employer/jobs/${jobId}/photos/order`,
    { order },
    { handleErrorInline: true },
  );
  return isOk(res);
}

export async function replaceScreeningQuestions(
  locale: string,
  jobId: string,
  questions: Array<Omit<JobScreeningQuestionView, 'id'> & { id?: string }>,
): Promise<JobScreeningQuestionView[] | null> {
  const res = await client(locale).put<{ questions: JobScreeningQuestionView[] }>(
    `/v1/employer/jobs/${jobId}/screening-questions`,
    { questions },
    { handleErrorInline: true },
  );
  if (!isOk(res)) return null;
  return res.data.questions;
}

export type MatchPreviewResult = {
  qualifyingCount: number;
  topMatchCount: number;
  radiusMiles: number;
};

export async function fetchMatchPreview(
  locale: string,
  params: {
    skills?: string[];
    minExperience?: string;
    minAge?: string;
    county?: string;
    siteLat?: number | null;
    siteLng?: number | null;
    radiusMiles?: number;
  },
): Promise<MatchPreviewResult | null> {
  const qs = new URLSearchParams();
  for (const s of params.skills ?? []) qs.append('skills', s);
  if (params.minExperience) qs.set('minExperience', params.minExperience);
  if (params.minAge) qs.set('minAge', params.minAge);
  if (params.county) qs.set('county', params.county);
  if (params.siteLat != null) qs.set('siteLat', String(params.siteLat));
  if (params.siteLng != null) qs.set('siteLng', String(params.siteLng));
  if (params.radiusMiles) qs.set('radiusMiles', String(params.radiusMiles));
  const res = await client(locale).get<MatchPreviewResult>(
    `/v1/employer/jobs/match-preview?${qs.toString()}`,
    { handleErrorInline: true },
  );
  if (!isOk(res)) return null;
  return res.data;
}

