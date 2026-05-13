import 'server-only';
import type { UserRole } from '@agconn/auth';
import { getServerApiClient } from './server-client';

export type MeResponse = {
  user: { id: string; role: UserRole };
  tenant: { id: string; slug: string; name: string } | null;
};

export type FetchMeResult =
  | { ok: true; data: MeResponse }
  | { ok: false; code: 'unauthenticated' | 'no_tenant' | 'unknown' };

export async function fetchMe(): Promise<FetchMeResult> {
  const api = await getServerApiClient();
  const res = await api.get<MeResponse>('/v1/me', { handleErrorInline: true });
  if (res.ok) return { ok: true, data: res.data };
  const code = res.error.code;
  if (code === 'unauthenticated') return { ok: false, code: 'unauthenticated' };
  if (code === 'no_tenant') return { ok: false, code: 'no_tenant' };
  return { ok: false, code: 'unknown' };
}

export type ShiftRow = {
  id: string;
  status: 'assigned' | 'confirmed' | 'declined' | 'no_show' | 'attended';
  hoursWorked: number | null;
  arrivedAt: string | null;
  shift: {
    id: string;
    date: string;
    startTime: string;
    endTime: string | null;
    locationLabel: string;
    locationLat: number | null;
    locationLng: number | null;
    status: string;
    notes: string | null;
    employer: string;
    crewName: string | null;
    foremanPhone: string | null;
    jobTitleEn: string | null;
    jobTitleEs: string | null;
  };
};

export async function fetchMyShifts(
  range: { from?: string; to?: string } = {},
): Promise<ShiftRow[]> {
  const api = await getServerApiClient();
  const res = await api.get<{ shifts: ShiftRow[] }>('/v1/me/shifts', {
    query: { from: range.from, to: range.to },
    handleErrorInline: true,
  });
  if (!res.ok) return [];
  return res.data.shifts;
}

export type Paystub = {
  id: string;
  period: string;
  payDate: string;
  employer: string;
  hours: number;
  overtimeHours: number;
  grossCents: number;
  bonusCents: number;
  taxesCents: number;
  netCents: number;
  status: 'approved' | 'paid';
};

export type PaySummary = {
  ytdGrossCents: number;
  ytdHours: number;
  weeksLogged: number;
  employerCount: number;
  avgHourlyCents: number;
  nextDeposit: {
    netCents: number;
    grossCents: number;
    hours: number;
    payDate: string;
  } | null;
};

export async function fetchMyPay(): Promise<{
  paystubs: Paystub[];
  summary: PaySummary;
}> {
  const api = await getServerApiClient();
  const res = await api.get<{ paystubs: Paystub[]; summary: PaySummary }>(
    '/v1/me/pay',
    { handleErrorInline: true },
  );
  if (!res.ok) {
    return {
      paystubs: [],
      summary: {
        ytdGrossCents: 0,
        ytdHours: 0,
        weeksLogged: 0,
        employerCount: 0,
        avgHourlyCents: 0,
        nextDeposit: null,
      },
    };
  }
  return res.data;
}

export type Thread = {
  id: string;
  title: string;
  channel: 'sms' | 'whatsapp' | 'app';
  unreadCount: number;
  lastMessageAt: string | null;
  employer: string;
  lastMessage: {
    body: string;
    senderUserId: string;
    direction: 'inbound' | 'outbound';
    createdAt: string;
  } | null;
};

export type ThreadDetail = {
  conversation: {
    id: string;
    title: string;
    channel: 'sms' | 'whatsapp' | 'app';
    employer: string;
    pinnedShiftId: string | null;
  };
  messages: {
    id: string;
    body: string;
    senderUserId: string;
    direction: 'inbound' | 'outbound';
    channel: 'sms' | 'whatsapp' | 'app';
    isMe: boolean;
    createdAt: string;
  }[];
};

export async function fetchMyMessageThreads(): Promise<{
  threads: Thread[];
  totalUnread: number;
}> {
  const api = await getServerApiClient();
  const res = await api.get<{ threads: Thread[]; totalUnread: number }>(
    '/v1/me/messages',
    { handleErrorInline: true },
  );
  if (!res.ok) return { threads: [], totalUnread: 0 };
  return res.data;
}

export async function fetchMyMessageThread(id: string): Promise<ThreadDetail | null> {
  const api = await getServerApiClient();
  const res = await api.get<ThreadDetail>(
    `/v1/me/messages/${encodeURIComponent(id)}`,
    { handleErrorInline: true },
  );
  if (!res.ok) return null;
  return res.data;
}
