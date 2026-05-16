// Server-only accessors for the employer roster + the caller's employer
// memberships (drives the Team page and the employer switcher).
//
// On error we return null / [] and log via console.error so the failure
// surfaces in dev. Empty real data is treated as truth — never mocked.

import 'server-only';
import type { MemberView } from '@agconn/schemas';
import { isOk } from '@agconn/api-client';
import { getServerApiClient } from './server-client';

export type { MemberView };

export type MembershipView = {
  employerId: string;
  tenantId: string;
  legalName: string;
  roleKey: string;
  permissions: string[];
  scopeQualifier: string | null;
};

export type MembershipsResult = {
  activeEmployerId: string | null;
  memberships: MembershipView[];
};

export async function listMembers(): Promise<MemberView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ members: MemberView[] }>('/v1/employer/members', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.members;
  } catch (e) {
    console.error('listMembers failed', e);
    return [];
  }
}

export async function getMyMemberships(): Promise<MembershipsResult> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<MembershipsResult>('/v1/me/employer-memberships', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return { activeEmployerId: null, memberships: [] };
    return res.data;
  } catch (e) {
    console.error('getMyMemberships failed', e);
    return { activeEmployerId: null, memberships: [] };
  }
}
