'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

type UpdateProgramInput = {
  descriptionEn?: string;
  descriptionEs?: string;
  locationName?: string;
  locationAddress?: string;
  sessionTimes?: { start: string; end: string; notes?: string }[];
};

export async function updateProgramAction(
  id: string,
  body: UpdateProgramInput,
): Promise<ActionResult<null>> {
  const api = await getServerApiClient();
  const res = await api.patch(
    `/v1/org/training/${encodeURIComponent(id)}`,
    body,
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/training-org/programs', 'page');
  revalidatePath(`/[locale]/training-org/programs/${id}/edit`, 'page');
  return { ok: true, data: null };
}

export async function cancelProgramAction(
  id: string,
  reason?: string,
): Promise<ActionResult<{ notified: number }>> {
  const api = await getServerApiClient();
  const res = await api.post<{ ok: boolean; notified: number }>(
    `/v1/org/training/${encodeURIComponent(id)}/cancel`,
    { reason: reason ?? undefined },
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/training-org/programs', 'page');
  revalidatePath(`/[locale]/training-org/programs/${id}/roster`, 'page');
  return { ok: true, data: { notified: res.data.notified } };
}

export async function bulkUpdateEnrollmentsAction(
  programId: string,
  enrollmentIds: string[],
  status: 'completed' | 'dropped',
  noShow?: boolean,
): Promise<ActionResult<{ updated: number }>> {
  const api = await getServerApiClient();
  const res = await api.patch<{ ok: boolean; updated: number }>(
    `/v1/org/training/${encodeURIComponent(programId)}/enrollments`,
    { enrollmentIds, status, noShow },
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath(`/[locale]/training-org/programs/${programId}/roster`, 'page');
  return { ok: true, data: { updated: res.data.updated } };
}
