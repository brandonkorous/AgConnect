import 'server-only';
import { adminFetch } from './api-server';

// ─── messaging ──────────────────────────────────────────────────────────────

export type ConversationListRow = {
  id: string;
  tenantId: string;
  employerId: string;
  title: string;
  isGroup: boolean;
  channel: 'app' | 'sms';
  messageCount: number;
  participantCount: number;
  lastMessageAt: string | null;
  createdAt: string;
};

export type ConversationDetail = {
  conversation: {
    id: string;
    tenantId: string;
    employerId: string;
    title: string;
    isGroup: boolean;
    channel: 'app' | 'sms';
    pinnedShiftId: string | null;
    lastMessageAt: string | null;
    createdAt: string;
  };
  reveal: boolean;
  participants: {
    id: string;
    userId: string;
    role: string;
    email: string | null;
    phone: string | null;
  }[];
  messages: {
    id: string;
    senderUserId: string;
    direction: 'inbound' | 'outbound';
    channel: 'app' | 'sms';
    body: string;
    smsLogId: string | null;
    createdAt: string;
  }[];
};

export type KeywordRow = {
  id: string;
  tenantId: string;
  keyword: string;
  kind: string;
  entityId: string;
  active: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export const fetchConversations = (q: { search?: string; channel?: string }) =>
  adminFetch<{ conversations: ConversationListRow[] }>('/admin/v1/ops/conversations', {
    query: { search: q.search, channel: q.channel },
  });

export const fetchConversation = (id: string, reveal: boolean) =>
  adminFetch<ConversationDetail>(
    `/admin/v1/ops/conversations/${encodeURIComponent(id)}`,
    { query: { reveal: reveal ? 'true' : undefined } },
  );

export const fetchKeywords = (q: { active?: 'true' | 'false' }) =>
  adminFetch<{ keywords: KeywordRow[] }>('/admin/v1/ops/keywords', {
    query: { active: q.active },
  });

// ─── sms ────────────────────────────────────────────────────────────────────

export type SmsRow = {
  id: string;
  tenantId: string;
  userId: string | null;
  template: string;
  locale: 'en' | 'es';
  toPhone: string;
  body: string;
  status: string;
  providerSid: string | null;
  errorCode: string | null;
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
};

export type SmsOptOutRow = {
  phone: string;
  optedOutAt: string;
  source: string;
};

export const fetchSms = (q: {
  search?: string;
  status?: string;
  template?: string;
  reveal?: boolean;
}) =>
  adminFetch<{ reveal: boolean; sms: SmsRow[] }>('/admin/v1/ops/sms', {
    query: {
      search: q.search,
      status: q.status,
      template: q.template,
      reveal: q.reveal ? 'true' : undefined,
    },
  });

export const fetchSmsOptOuts = (q: { search?: string; reveal?: boolean }) =>
  adminFetch<{ reveal: boolean; optOuts: SmsOptOutRow[] }>(
    '/admin/v1/ops/sms/opt-outs',
    { query: { search: q.search, reveal: q.reveal ? 'true' : undefined } },
  );

// ─── email ──────────────────────────────────────────────────────────────────

export type EmailRow = {
  id: string;
  tenantId: string | null;
  template: string;
  locale: 'en' | 'es';
  toEmail: string;
  fromEmail: string;
  subject: string;
  status: string;
  providerId: string | null;
  errorMsg: string | null;
  refType: string | null;
  refId: string | null;
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
  failedAt: string | null;
};

export type EmailSuppressionRow = {
  email: string;
  reason: string;
  source: string;
  suppressedAt: string;
};

export const fetchEmails = (q: {
  search?: string;
  status?: string;
  template?: string;
  reveal?: boolean;
}) =>
  adminFetch<{ reveal: boolean; emails: EmailRow[] }>('/admin/v1/ops/email', {
    query: {
      search: q.search,
      status: q.status,
      template: q.template,
      reveal: q.reveal ? 'true' : undefined,
    },
  });

export const fetchEmailSuppressions = (q: {
  search?: string;
  reason?: string;
  reveal?: boolean;
}) =>
  adminFetch<{ reveal: boolean; suppressions: EmailSuppressionRow[] }>(
    '/admin/v1/ops/email/suppressions',
    {
      query: {
        search: q.search,
        reason: q.reason,
        reveal: q.reveal ? 'true' : undefined,
      },
    },
  );

// ─── billing ────────────────────────────────────────────────────────────────

export type BillingRow = {
  id: string;
  tenantId: string;
  employerId: string;
  employerName: string;
  eventType: string;
  stripeEventId: string;
  processedAt: string | null;
  errorMsg: string | null;
  createdAt: string;
};

export type BillingDetail = {
  event: BillingRow & { payload: unknown };
};

export const fetchBilling = (q: {
  search?: string;
  eventType?: string;
  processed?: 'true' | 'false';
}) =>
  adminFetch<{ events: BillingRow[] }>('/admin/v1/ops/billing', {
    query: { search: q.search, eventType: q.eventType, processed: q.processed },
  });

export const fetchBillingEvent = (id: string) =>
  adminFetch<BillingDetail>(`/admin/v1/ops/billing/${encodeURIComponent(id)}`);

// ─── waitlist ───────────────────────────────────────────────────────────────

export type WaitlistRow = {
  id: string;
  tenantId: string | null;
  email: string | null;
  phone: string | null;
  county: string | null;
  preferredLang: 'en' | 'es';
  audience: string | null;
  source: string;
  confirmedAt: string | null;
  welcomedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
};

export type WaitlistSummary = { audience: string; count: number };

export const fetchWaitlist = (q: {
  search?: string;
  audience?: string;
  source?: string;
  state?: 'pending' | 'confirmed' | 'welcomed' | 'unsubscribed';
  reveal?: boolean;
}) =>
  adminFetch<{
    reveal: boolean;
    summary: WaitlistSummary[];
    rows: WaitlistRow[];
  }>('/admin/v1/ops/waitlist', {
    query: {
      search: q.search,
      audience: q.audience,
      source: q.source,
      state: q.state,
      reveal: q.reveal ? 'true' : undefined,
    },
  });
