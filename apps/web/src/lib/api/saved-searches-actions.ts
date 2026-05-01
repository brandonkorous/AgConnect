'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';
import type { SavedSearch } from './saved-searches';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export type SavedSearchInput = {
  name?: string | null;
  filters: SavedSearch['filters'];
  alertChannel: SavedSearch['alertChannel'];
  alertActive: boolean;
};

export async function createSavedSearchAction(
  input: SavedSearchInput,
): Promise<ActionResult<SavedSearch>> {
  const api = await getServerApiClient();
  const res = await api.post<SavedSearch>('/v1/saved-searches', input, {
    handleErrorInline: true,
  });
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/worker/saved-searches', 'page');
  return { ok: true, data: res.data };
}

export async function patchSavedSearchAction(
  id: string,
  input: Partial<SavedSearchInput>,
): Promise<ActionResult<SavedSearch>> {
  const api = await getServerApiClient();
  const res = await api.patch<SavedSearch>(
    `/v1/saved-searches/${encodeURIComponent(id)}`,
    input,
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/worker/saved-searches', 'page');
  return { ok: true, data: res.data };
}

export async function deleteSavedSearchAction(
  id: string,
): Promise<ActionResult<null>> {
  const api = await getServerApiClient();
  const res = await api.del(`/v1/saved-searches/${encodeURIComponent(id)}`, {
    handleErrorInline: true,
  });
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/worker/saved-searches', 'page');
  return { ok: true, data: null };
}
