'use server';

import { revalidatePath } from 'next/cache';
import { adminFetch } from '@/lib/api-server';

export type SaveResult =
  | { ok: true; data: { id: string; value: string; status: string; updatedAt: string } }
  | { ok: false; error: { code: string; message: string } };

// Patches a single translation cell. Called from the inline editor on blur or
// Cmd/Ctrl+Enter. Returns the updated cell so the client can replace its
// optimistic state with server-confirmed values.
export async function saveTranslation(id: string, value: string): Promise<SaveResult> {
  const result = await adminFetch<{
    id: string;
    value: string;
    status: string;
    updatedAt: string;
  }>(`/admin/v1/translations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { value },
  });
  if (!result.ok) return result;
  // Refresh the page's server-rendered data so the right rail metadata
  // reflects the new updatedAt without a full reload.
  revalidatePath('/translations');
  return result;
}

export type CreateResult =
  | { ok: true; data: { created: { id: string; locale: 'en' | 'es' }[] } }
  | { ok: false; error: { code: string; message: string } };

export async function createTranslation(input: {
  scope: 'platform' | 'tenant';
  tenantId: string | null;
  namespace: string;
  key: string;
  valueEn?: string;
  valueEs?: string;
}): Promise<CreateResult> {
  const result = await adminFetch<{ created: { id: string; locale: 'en' | 'es' }[] }>(
    '/admin/v1/translations',
    {
      method: 'POST',
      body: {
        scope: input.scope,
        tenantId: input.tenantId ?? undefined,
        namespace: input.namespace,
        key: input.key,
        valueEn: input.valueEn,
        valueEs: input.valueEs,
      },
      tenantId: input.tenantId,
    },
  );
  if (result.ok) revalidatePath('/translations');
  return result;
}

export async function deleteTranslation(id: string): Promise<{
  ok: boolean;
  error?: { code: string; message: string };
}> {
  const result = await adminFetch<{ id: string }>(
    `/admin/v1/translations/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
  if (result.ok) {
    revalidatePath('/translations');
    return { ok: true };
  }
  return { ok: false, error: result.error };
}
