'use server';

import { revalidatePath } from 'next/cache';
import { getServerApiClient } from './server-client';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export async function confirmShiftAction(
  assignmentId: string,
): Promise<ActionResult<{ status: string }>> {
  const api = await getServerApiClient();
  const res = await api.post<{ status: string }>(
    `/v1/me/shifts/${encodeURIComponent(assignmentId)}/confirm`,
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/worker/shifts', 'page');
  revalidatePath('/[locale]/worker/dashboard', 'page');
  return { ok: true, data: { status: res.data.status } };
}

export async function declineShiftAction(
  assignmentId: string,
): Promise<ActionResult<{ status: string }>> {
  const api = await getServerApiClient();
  const res = await api.post<{ status: string }>(
    `/v1/me/shifts/${encodeURIComponent(assignmentId)}/decline`,
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/worker/shifts', 'page');
  return { ok: true, data: { status: res.data.status } };
}

export async function arriveAtShiftAction(
  assignmentId: string,
): Promise<ActionResult<{ arrivedAt: string }>> {
  const api = await getServerApiClient();
  const res = await api.post<{ arrivedAt: string }>(
    `/v1/me/shifts/${encodeURIComponent(assignmentId)}/arrive`,
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/field', 'page');
  revalidatePath('/[locale]/worker/shifts', 'page');
  return { ok: true, data: { arrivedAt: res.data.arrivedAt } };
}

export async function sendMessageAction(
  conversationId: string,
  body: string,
): Promise<ActionResult<{ id: string }>> {
  const api = await getServerApiClient();
  const res = await api.post<{ id: string }>(
    `/v1/me/messages/${encodeURIComponent(conversationId)}/send`,
    { body },
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/worker/messages', 'page');
  return { ok: true, data: { id: res.data.id } };
}

export async function markAllMessagesReadAction(): Promise<ActionResult<{ marked: number }>> {
  const api = await getServerApiClient();
  const res = await api.post<{ marked: number }>(
    '/v1/me/messages/read-all',
    null,
    { handleErrorInline: true },
  );
  if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
  revalidatePath('/[locale]/worker/messages', 'page');
  revalidatePath('/[locale]/worker/dashboard', 'page');
  return { ok: true, data: { marked: res.data.marked } };
}
