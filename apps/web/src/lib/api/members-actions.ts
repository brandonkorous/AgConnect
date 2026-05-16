'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { MemberInput, MemberPatch } from '@agconn/schemas';
import { getServerApiClient } from './server-client';
import { ACTIVE_EMPLOYER_COOKIE } from './server-client';

export type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export type AcceptInviteResult =
  | { ok: true; employerId: string; employerName: string; roleKey: string }
  | { ok: false; code: string; message: string };

const TEAM_PATH = '/[locale]/employer/team';

function fail(res: { error: { code: string; message: string } }): ActionResult {
  return { ok: false, code: res.error.code, message: res.error.message };
}

export async function createMemberAction(input: MemberInput): Promise<ActionResult> {
  const api = await getServerApiClient();
  const res = await api.post('/v1/employer/members', input, { handleErrorInline: true });
  if (!res.ok) return fail(res);
  revalidatePath(TEAM_PATH, 'page');
  return { ok: true };
}

export async function patchMemberAction(
  id: string,
  patch: MemberPatch,
): Promise<ActionResult> {
  const api = await getServerApiClient();
  const res = await api.patch(`/v1/employer/members/${id}`, patch, {
    handleErrorInline: true,
  });
  if (!res.ok) return fail(res);
  revalidatePath(TEAM_PATH, 'page');
  return { ok: true };
}

export async function deleteMemberAction(id: string): Promise<ActionResult> {
  const api = await getServerApiClient();
  const res = await api.del(`/v1/employer/members/${id}`, { handleErrorInline: true });
  if (!res.ok) return fail(res);
  revalidatePath(TEAM_PATH, 'page');
  return { ok: true };
}

export async function resendInviteAction(id: string): Promise<ActionResult> {
  const api = await getServerApiClient();
  const res = await api.post(`/v1/employer/members/${id}/invite`, undefined, {
    handleErrorInline: true,
  });
  if (!res.ok) return fail(res);
  revalidatePath(TEAM_PATH, 'page');
  return { ok: true };
}

export async function transferOwnerAction(contactId: string): Promise<ActionResult> {
  const api = await getServerApiClient();
  const res = await api.post(
    '/v1/employer/members/transfer-owner',
    { contactId },
    { handleErrorInline: true },
  );
  if (!res.ok) return fail(res);
  revalidatePath(TEAM_PATH, 'page');
  return { ok: true };
}

// Persists the active employer for a multi-employer member. The cookie is
// read server-side by getServerApiClient and sent as X-Employer-Id; the
// API still validates it against the membership set on every request.
export async function switchEmployerAction(employerId: string): Promise<ActionResult> {
  const jar = await cookies();
  jar.set(ACTIVE_EMPLOYER_COOKIE, employerId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath('/[locale]/employer', 'layout');
  return { ok: true };
}

export async function acceptInviteAction(token: string): Promise<AcceptInviteResult> {
  const api = await getServerApiClient();
  const res = await api.post<{
    employerId: string;
    employerName: string;
    roleKey: string;
  }>(`/v1/me/employer-invitations/${encodeURIComponent(token)}/accept`, undefined, {
    handleErrorInline: true,
  });
  if (!res.ok) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  // Make the freshly-accepted employer the active one immediately.
  const jar = await cookies();
  jar.set(ACTIVE_EMPLOYER_COOKIE, res.data.employerId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath('/[locale]/employer', 'layout');
  return {
    ok: true,
    employerId: res.data.employerId,
    employerName: res.data.employerName,
    roleKey: res.data.roleKey,
  };
}
