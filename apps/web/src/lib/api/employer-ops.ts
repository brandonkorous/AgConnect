// Server-only data accessors for employer operations surfaces:
// crews & shifts, payroll, compliance, messages, reports.
//
// All endpoints have real backends. The mock fixtures are only used when:
//   1. Clerk env keys are missing (no auth context — pure dev preview), or
//   2. The API request errors out (network failure / API container down).
// Empty data from a real authenticated request is treated as truth, not a
// fallback signal — onboarding seeds compliance items and a payroll period.

import 'server-only';
import { isOk } from '@agconn/api-client';
import { getServerApiClient } from './server-client';

const apiConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

// ───────────────────────────────────────────────── Crews & shifts

export type CrewView = {
  id: string;
  name: string;
  color: 'primary' | 'accent' | 'info' | 'success' | 'warning';
  foremanUserId: string | null;
  foremanName: string | null;
  jobId: string | null;
  jobTitle: string | null;
  memberCount: number;
  notes: string | null;
};

export type ShiftView = {
  id: string;
  crewId: string | null;
  crewName: string | null;
  jobId: string | null;
  shiftDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string | null;
  locationLabel: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedCount: number;
  confirmedCount: number;
  capacity: number | null;
};

const MOCK_CREWS: CrewView[] = [
  {
    id: 'crew-a',
    name: 'Crew A · Grape harvest',
    color: 'primary',
    foremanUserId: 'usr-foreman-a',
    foremanName: 'Manuel Vargas',
    jobId: 'job-1',
    jobTitle: 'Grape Harvest',
    memberCount: 14,
    notes: null,
  },
  {
    id: 'crew-b',
    name: 'Crew B · Sort line',
    color: 'success',
    foremanUserId: 'usr-foreman-b',
    foremanName: 'Lucia Mendez',
    jobId: 'job-4',
    jobTitle: 'Sort Line — Day Shift',
    memberCount: 8,
    notes: null,
  },
  {
    id: 'crew-c',
    name: 'Crew C · Vineyard setup',
    color: 'accent',
    foremanUserId: 'usr-foreman-c',
    foremanName: 'Tomás Ríos',
    jobId: 'job-2',
    jobTitle: 'Vineyard Setup Crew',
    memberCount: 6,
    notes: null,
  },
  {
    id: 'crew-d',
    name: 'Crew D · Almond pre-shake',
    color: 'warning',
    foremanUserId: null,
    foremanName: null,
    jobId: 'job-3',
    jobTitle: 'Almond Pre-shake Crew',
    memberCount: 3,
    notes: 'still hiring',
  },
];

function mockShifts(weekStart: Date): ShiftView[] {
  const result: ShiftView[] = [];
  const days = 5;
  for (let d = 0; d < days; d++) {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + d);
    const dateStr = date.toISOString().slice(0, 10);

    result.push(
      shift(`crewA-${d}`, 'crew-a', 'Crew A · Grape harvest', dateStr, '06:00', '14:00', 'Block 7-North', 14, 13),
      shift(`crewB-${d}`, 'crew-b', 'Crew B · Sort line', dateStr, '07:00', '15:00', 'Pack house', 8, 8),
    );
    if (d >= 1) {
      result.push(
        shift(`crewC-${d}`, 'crew-c', 'Crew C · Vineyard setup', dateStr, '06:00', '14:00', 'Block 4-East', 6, d >= 2 ? 6 : 5),
      );
    }
    if (d >= 1) {
      result.push(
        shift(`crewD-${d}`, 'crew-d', 'Crew D · Almond pre-shake', dateStr, '05:30', '13:30', 'East orchard', d <= 1 ? 3 : 12, d <= 1 ? 0 : 9),
      );
    }
  }
  return result;
}

function shift(
  id: string,
  crewId: string,
  crewName: string,
  date: string,
  start: string,
  end: string,
  loc: string,
  assigned: number,
  confirmed: number,
): ShiftView {
  return {
    id,
    crewId,
    crewName,
    jobId: null,
    shiftDate: date,
    startTime: start,
    endTime: end,
    locationLabel: loc,
    status: 'scheduled',
    assignedCount: assigned,
    confirmedCount: confirmed,
    capacity: null,
  };
}

export async function listCrews(): Promise<CrewView[]> {
  if (!apiConfigured()) return MOCK_CREWS;
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ crews: CrewView[] }>('/v1/employer/crews', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return MOCK_CREWS;
    return res.data.crews;
  } catch {
    return MOCK_CREWS;
  }
}

export async function listShifts(opts?: {
  from?: Date;
  to?: Date;
  crewId?: string;
}): Promise<ShiftView[]> {
  const weekStart = startOfWorkWeek(opts?.from ?? new Date());
  if (!apiConfigured()) return mockShifts(weekStart);
  try {
    const client = await getServerApiClient();
    const params: Record<string, string> = {
      from: weekStart.toISOString().slice(0, 10),
      to: new Date(weekStart.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };
    if (opts?.crewId) params.crewId = opts.crewId;
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const res = await client.get<{ shifts: ShiftView[] }>(`/v1/employer/shifts?${qs}`, {
      handleErrorInline: true,
    });
    if (!isOk(res)) return mockShifts(weekStart);
    return res.data.shifts;
  } catch {
    return mockShifts(weekStart);
  }
}

export function startOfWorkWeek(d: Date): Date {
  const dow = d.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow; // Monday-anchored
  const out = new Date(d);
  out.setUTCDate(d.getUTCDate() + offset);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

// ───────────────────────────────────────────────── Payroll

export type PayrollPeriodView = {
  id: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: 'draft' | 'approved' | 'paid';
  totals: {
    workers: number;
    hours: number;
    grossCents: number;
    bonusCents: number;
    taxesCents: number;
    netCents: number;
  };
};

export type PayrollLineView = {
  id: string;
  workerUserId: string;
  workerName: string;
  workerInitials: string;
  role: string;
  hours: number;
  overtimeHours: number;
  grossCents: number;
  bonusCents: number;
  netCents: number;
  approvedAt: string | null;
};

const MOCK_PAYROLL_PERIOD: PayrollPeriodView = {
  id: 'pp-current',
  startDate: '2026-04-27',
  endDate: '2026-05-03',
  payDate: '2026-05-08',
  status: 'draft',
  totals: {
    workers: 26,
    hours: 1187,
    grossCents: 3_321_040,
    bonusCents: 184_000,
    taxesCents: 471_760,
    netCents: 2_849_240,
  },
};

const MOCK_PAYROLL_LINES: PayrollLineView[] = [
  { id: 'pl-1', workerUserId: 'usr-6', workerName: 'Miguel Reyes',     workerInitials: 'MR', role: 'Crew A · Lead',     hours: 52, overtimeHours: 12, grossCents: 132_550, bonusCents: 18_000, netCents: 118_420, approvedAt: null },
  { id: 'pl-2', workerUserId: 'usr-7', workerName: 'Carmen Rojas',     workerInitials: 'CR', role: 'Crew A · Picker',   hours: 48, overtimeHours:  8, grossCents: 111_600, bonusCents:  9_200, netCents:  99_430, approvedAt: null },
  { id: 'pl-3', workerUserId: 'usr-2', workerName: 'Soledad Saavedra', workerInitials: 'SS', role: 'Crew B · Sort',     hours: 45, overtimeHours:  5, grossCents:  94_550, bonusCents:      0, netCents:  83_820, approvedAt: null },
  { id: 'pl-4', workerUserId: 'usr-3', workerName: 'Beto Villalobos',  workerInitials: 'BV', role: 'Crew B · Sort',     hours: 45, overtimeHours:  5, grossCents:  94_550, bonusCents:      0, netCents:  83_820, approvedAt: null },
  { id: 'pl-5', workerUserId: 'usr-foreman-c', workerName: 'Tomás Ríos', workerInitials: 'TR', role: 'Crew C · Foreman',  hours: 48, overtimeHours:  8, grossCents: 129_600, bonusCents: 22_000, netCents: 116_240, approvedAt: null },
  { id: 'pl-6', workerUserId: 'usr-5', workerName: 'Rosa Aguilar',     workerInitials: 'RA', role: 'Crew C · Setup',    hours: 40, overtimeHours:  0, grossCents:  80_000, bonusCents:  4_000, netCents:  71_250, approvedAt: null },
];

type ApiPayrollPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: 'draft' | 'approved' | 'paid';
  approvedAt: string | null;
  paidAt: string | null;
  totals: PayrollPeriodView['totals'];
};

type ApiPayrollLine = {
  id: string;
  periodId: string;
  workerUserId: string;
  workerName: string;
  workerInitials: string;
  role: string | null;
  hours: number;
  overtimeHours: number;
  grossCents: number;
  bonusCents: number;
  netCents: number;
  approvedAt: string | null;
};

function emptyPayrollPeriod(): PayrollPeriodView {
  const now = new Date();
  const dow = now.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() + offset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const pay = new Date(end);
  pay.setUTCDate(end.getUTCDate() + 5);
  return {
    id: '',
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    payDate: pay.toISOString().slice(0, 10),
    status: 'draft',
    totals: { workers: 0, hours: 0, grossCents: 0, bonusCents: 0, taxesCents: 0, netCents: 0 },
  };
}

export async function getCurrentPayrollPeriod(): Promise<PayrollPeriodView> {
  if (!apiConfigured()) return MOCK_PAYROLL_PERIOD;
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ periods: ApiPayrollPeriod[] }>(
      '/v1/employer/payroll/periods',
      { handleErrorInline: true },
    );
    if (!isOk(res)) return MOCK_PAYROLL_PERIOD;
    if (res.data.periods.length === 0) {
      // Real authenticated employer with no periods yet — return a synthesized
      // empty draft period so the UI renders cleanly without flashing fixtures.
      return emptyPayrollPeriod();
    }
    const draft = res.data.periods.find((p) => p.status === 'draft');
    const p = draft ?? res.data.periods[0]!;
    return {
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      payDate: p.payDate,
      status: p.status,
      totals: p.totals,
    };
  } catch {
    return MOCK_PAYROLL_PERIOD;
  }
}

export async function listPayrollLines(periodId?: string): Promise<PayrollLineView[]> {
  if (!apiConfigured()) return MOCK_PAYROLL_LINES;
  if (!periodId) return [];
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ lines: ApiPayrollLine[] }>(
      `/v1/employer/payroll/periods/${periodId}/lines`,
      { handleErrorInline: true },
    );
    if (!isOk(res)) return MOCK_PAYROLL_LINES;
    // Empty real data is truth — the period just hasn't been generated yet.
    return res.data.lines.map((l) => ({
      id: l.id,
      workerUserId: l.workerUserId,
      workerName: l.workerName || '—',
      workerInitials: l.workerInitials || '??',
      role: l.role ?? '',
      hours: l.hours,
      overtimeHours: l.overtimeHours,
      grossCents: l.grossCents,
      bonusCents: l.bonusCents,
      netCents: l.netCents,
      approvedAt: l.approvedAt,
    }));
  } catch {
    return MOCK_PAYROLL_LINES;
  }
}

// ───────────────────────────────────────────────── Compliance

export type ComplianceCategoryView = {
  key: string;
  label: string;
  score: number;
  items: ComplianceItemView[];
};

export type ComplianceItemView = {
  id?: string;
  key: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  details: string;
  dueAt: string | null;
  evidenceUrl?: string | null;
};

const MOCK_COMPLIANCE_CATEGORIES: ComplianceCategoryView[] = [
  {
    key: 'documentation',
    label: 'Worker documentation',
    score: 94,
    items: [
      { key: 'i9_on_file', label: 'I-9 forms on file', status: 'ok', details: '24 of 26', dueAt: null },
      { key: 'i9_expiring', label: '2 I-9s expiring within 30 days', status: 'fail', details: 'Pedro E., Tomás R.', dueAt: '2026-05-29' },
      { key: 'w4_collected', label: 'W-4s collected', status: 'ok', details: 'All workers', dueAt: null },
    ],
  },
  {
    key: 'safety',
    label: 'Worker safety (Cal/OSHA)',
    score: 100,
    items: [
      { key: 'heat_plan',     label: 'Heat illness prevention plan', status: 'ok', details: 'Posted · trained 26/26', dueAt: null },
      { key: 'wps_training',  label: 'Pesticide handler training (WPS)', status: 'ok', details: 'Current · expires Mar 2027', dueAt: '2027-03-31' },
      { key: 'covid_plan',    label: 'COVID-19 prevention plan', status: 'ok', details: 'Updated July 12', dueAt: null },
    ],
  },
  {
    key: 'wage_hour',
    label: 'Wage & hour',
    score: 96,
    items: [
      { key: 'piece_breaks',  label: 'Piece-rate paid breaks tracked', status: 'ok', details: 'AB 1513 compliant', dueAt: null },
      { key: 'overtime',      label: 'Overtime calculations',          status: 'ok', details: 'Phase-in 2025: 8h/40h', dueAt: null },
      { key: 'wage_stmts',    label: 'Itemized wage statements',       status: 'ok', details: 'Auto-generated', dueAt: null },
    ],
  },
  {
    key: 'pesticide',
    label: 'Pesticide records',
    score: 100,
    items: [
      { key: 'pur_records',   label: 'Application records (PUR)', status: 'ok', details: 'Filed monthly', dueAt: null },
      { key: 'noi_filing',    label: 'Notice of Intent (NOI)',    status: 'ok', details: 'CDPR submitted', dueAt: null },
    ],
  },
  {
    key: 'h2a',
    label: 'H-2A program',
    score: 88,
    items: [
      { key: 'aewr_rate',     label: 'AEWR rate compliance',     status: 'ok',   details: '$19.97/hr applied', dueAt: null },
      { key: 'housing_insp',  label: 'Housing inspection',        status: 'warn', details: 'Due Aug 22',          dueAt: '2026-08-22' },
      { key: 'three_quarter', label: '3/4 guarantee tracking',    status: 'ok',   details: 'Auto-tracked',         dueAt: null },
    ],
  },
];

type ApiComplianceItem = {
  id: string;
  category: string;
  itemKey: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  details: string | null;
  evidenceUrl: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
};

type ApiComplianceCategory = {
  category: string;
  score: number;
  items: ApiComplianceItem[];
};

const CATEGORY_LABELS: Record<string, string> = {
  documentation: 'Worker documentation',
  safety: 'Worker safety (Cal/OSHA)',
  wage_hour: 'Wage & hour',
  pesticide: 'Pesticide records',
  h2a: 'H-2A program',
  custom: 'Other',
};

export async function listComplianceCategories(): Promise<ComplianceCategoryView[]> {
  if (!apiConfigured()) return MOCK_COMPLIANCE_CATEGORIES;
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      categories: ApiComplianceCategory[];
      actions: { id: string; severity: 'urgent' | 'soon'; label: string; details: string; dueAt: string | null }[];
    }>('/v1/employer/compliance/items', { handleErrorInline: true });
    if (!isOk(res)) return MOCK_COMPLIANCE_CATEGORIES;
    if (res.data.categories.length === 0) return [];
    return res.data.categories.map((c) => ({
      key: c.category,
      label: CATEGORY_LABELS[c.category] ?? c.category,
      score: c.score,
      items: c.items.map((i) => ({
        id: i.id,
        key: i.itemKey,
        label: i.label,
        status: i.status,
        details: i.details ?? '',
        dueAt: i.dueAt,
        evidenceUrl: i.evidenceUrl,
      })),
    }));
  } catch {
    return MOCK_COMPLIANCE_CATEGORIES;
  }
}

export type ComplianceActionView = {
  id: string | null;
  severity: 'urgent' | 'soon';
  title: string;
  detail: string;
  cta: string;
};

const MOCK_COMPLIANCE_ACTIONS: ComplianceActionView[] = [
  {
    id: null,
    severity: 'urgent',
    title: 'Two I-9s expiring within 30 days',
    detail: 'Pedro Estrella (May 29) · Tomás Ríos (Jun 1) — re-verify with current ID.',
    cta: 'Re-verify',
  },
  {
    id: null,
    severity: 'soon',
    title: 'H-2A housing inspection due Aug 22',
    detail: 'Annual housing inspection per 20 CFR 655.122 — schedule with CDPH 14 days in advance.',
    cta: 'Schedule',
  },
];

export async function listComplianceActions(): Promise<ComplianceActionView[]> {
  if (!apiConfigured()) return MOCK_COMPLIANCE_ACTIONS;
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      categories: ApiComplianceCategory[];
      actions: { id: string; severity: 'urgent' | 'soon'; label: string; details: string; dueAt: string | null }[];
    }>('/v1/employer/compliance/items', { handleErrorInline: true });
    if (!isOk(res)) return MOCK_COMPLIANCE_ACTIONS;
    // Zero open actions is a real (good!) state — return an empty list.
    return res.data.actions.map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.label,
      detail: a.details,
      cta: a.severity === 'urgent' ? 'Resolve' : 'Schedule',
    }));
  } catch {
    return MOCK_COMPLIANCE_ACTIONS;
  }
}

// ───────────────────────────────────────────────── Messages

export type MessageThreadView = {
  id: string;
  name: string;
  initials: string;
  preview: string;
  whenLabel: string;
  unread: number;
  channel: 'app' | 'sms' | 'whatsapp' | 'broadcast';
  group: boolean;
  category: 'candidates' | 'crew' | 'foremen' | 'broadcasts';
  foremanPhone: string | null;
  participantCount: number;
};

export type FolderKey = 'all' | 'candidates' | 'crew' | 'foremen' | 'broadcasts';

export type FolderCounts = Record<FolderKey, number>;

export type MessageView = {
  id: string;
  threadId: string;
  senderRole: 'me' | 'them';
  body: string;
  whenLabel: string;
};

const MOCK_THREADS: MessageThreadView[] = [
  { id: 't-1', name: 'Crew A — Grape Harvest',     initials: 'A',  preview: 'M. Vargas: Pickup at 5:30 AM, Hwy 99…', whenLabel: '8m',   unread: 2, channel: 'app',       group: true,  category: 'crew',       foremanPhone: null,           participantCount: 14 },
  { id: 't-2', name: 'Pedro Estrella',             initials: 'PE', preview: 'You: Can you do Thu 9 AM interview?',     whenLabel: '32m',  unread: 0, channel: 'sms',       group: false, category: 'candidates', foremanPhone: null,           participantCount: 2 },
  { id: 't-3', name: 'Soledad Saavedra',           initials: 'SS', preview: 'Soledad: Yes, I have forklift cert…',     whenLabel: '2h',   unread: 1, channel: 'sms',       group: false, category: 'candidates', foremanPhone: null,           participantCount: 2 },
  { id: 't-4', name: 'Manuel Vargas (Foreman)',    initials: 'MV', preview: 'Manuel: Need 1 more for tomorrow',         whenLabel: '3h',   unread: 0, channel: 'whatsapp',  group: false, category: 'foremen',    foremanPhone: '+15595550144', participantCount: 2 },
  { id: 't-5', name: 'Almond Pre-shake applicants',initials: 'AP', preview: 'You: Job is still open — pay $21/hr…',    whenLabel: '5h',   unread: 0, channel: 'broadcast', group: true,  category: 'broadcasts', foremanPhone: null,           participantCount: 12 },
  { id: 't-6', name: 'Joaquín Núñez',              initials: 'JN', preview: 'Joaquín: Available Mon-Sat',               whenLabel: 'Yest', unread: 0, channel: 'sms',       group: false, category: 'candidates', foremanPhone: null,           participantCount: 2 },
  { id: 't-7', name: 'Rosa Aguilar',               initials: 'RA', preview: 'You: Welcome to the crew!',                 whenLabel: 'Yest', unread: 0, channel: 'app',       group: false, category: 'candidates', foremanPhone: null,           participantCount: 2 },
];

type ApiConversation = {
  id: string;
  title: string;
  isGroup: boolean;
  channel: 'app' | 'sms' | 'whatsapp' | 'broadcast';
  lastMessageAt: string | null;
  unreadCount: number;
  preview: string;
  category: 'candidates' | 'crew' | 'foremen' | 'broadcasts';
  foremanPhone: string | null;
  participantCount: number;
};

type ApiMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  channel: 'app' | 'sms' | 'whatsapp' | 'broadcast';
  direction: 'inbound' | 'outbound';
  createdAt: string;
};

export async function listThreads(folder: FolderKey = 'all'): Promise<{
  threads: MessageThreadView[];
  counts: FolderCounts;
}> {
  const mockCounts: FolderCounts = {
    all: MOCK_THREADS.length,
    candidates: MOCK_THREADS.filter((t) => t.category === 'candidates').length,
    crew: MOCK_THREADS.filter((t) => t.category === 'crew').length,
    foremen: MOCK_THREADS.filter((t) => t.category === 'foremen').length,
    broadcasts: MOCK_THREADS.filter((t) => t.category === 'broadcasts').length,
  };
  const filtered = folder === 'all' ? MOCK_THREADS : MOCK_THREADS.filter((t) => t.category === folder);
  if (!apiConfigured()) return { threads: filtered, counts: mockCounts };
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      conversations: ApiConversation[];
      counts: FolderCounts;
    }>(`/v1/employer/messages?folder=${folder}`, { handleErrorInline: true });
    if (!isOk(res)) {
      return { threads: filtered, counts: mockCounts };
    }
    return {
      threads: res.data.conversations.map((co) => ({
        id: co.id,
        name: co.title,
        initials: deriveInitials(co.title),
        preview: co.preview || '—',
        whenLabel: relTimeShort(co.lastMessageAt),
        unread: co.unreadCount,
        channel: co.channel,
        group: co.isGroup,
        category: co.category,
        foremanPhone: co.foremanPhone,
        participantCount: co.participantCount,
      })),
      counts: res.data.counts,
    };
  } catch {
    return { threads: filtered, counts: mockCounts };
  }
}

const MOCK_THREAD_T1: MessageView[] = [
  { id: 'm-1', threadId: 't-1', senderRole: 'them', body: 'Buenos días Elena. Listo para mañana. Tengo 13 confirmados y uno me dijo que no puede.',                          whenLabel: '7:42 AM' },
  { id: 'm-2', threadId: 't-1', senderRole: 'me',   body: 'Got it Manuel. Posting the 1 spot publicly now — should fill within an hour given how many applicants we have.', whenLabel: '7:44 AM' },
  { id: 'm-3', threadId: 't-1', senderRole: 'them', body: 'Perfect. Pickup en Hwy 99 a las 5:30 AM, regresamos al campo Block 7-Norte. Llevo agua + carpa de sombra.',       whenLabel: '7:46 AM' },
  { id: 'm-4', threadId: 't-1', senderRole: 'me',   body: 'Heat advisory says 102°F by 1 PM tomorrow. Push lunch to 11:30 and add a 10-min shade break at 9 AM and 1 PM.',  whenLabel: '7:48 AM' },
  { id: 'm-5', threadId: 't-1', senderRole: 'them', body: '✓ Voy a avisar al equipo por WhatsApp. ¿Pago piezas hoy o se junta con el viernes?',                              whenLabel: '7:51 AM' },
  { id: 'm-6', threadId: 't-1', senderRole: 'me',   body: 'Friday with payroll. Bonus rate is $0.18/lb — already loaded. See you at 5:30.',                                  whenLabel: '7:53 AM' },
];

export async function listMessages(threadId: string, employerUserId?: string): Promise<MessageView[]> {
  if (!apiConfigured()) {
    if (threadId !== 't-1') {
      return [
        { id: 'm-x', threadId, senderRole: 'them', body: 'Hi Elena — just confirming for tomorrow\'s shift.', whenLabel: '8:02 AM' },
        { id: 'm-y', threadId, senderRole: 'me',   body: 'Confirmed. See you at 6 AM.',                       whenLabel: '8:05 AM' },
      ];
    }
    return MOCK_THREAD_T1;
  }
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ messages: ApiMessage[] }>(
      `/v1/employer/messages/${threadId}/messages`,
      { handleErrorInline: true },
    );
    if (!isOk(res)) return [];
    return res.data.messages.map((m) => ({
      id: m.id,
      threadId: m.conversationId,
      senderRole: employerUserId && m.senderUserId === employerUserId ? 'me' : 'them',
      body: m.body,
      whenLabel: shortTime(m.createdAt),
    }));
  } catch {
    return [];
  }
}

function deriveInitials(name: string): string {
  const parts = name
    .replace(/[—–-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '??').toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function relTimeShort(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function shortTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}

// ───────────────────────────────────────────────── Reports

export type ReportsKpiView = {
  label: string;
  value: string;
  delta: string;
  sub: string;
};

export type ReportsByJobTypeView = {
  label: string;
  applied: number;
  hired: number;
  fillPct: number;
};

export type ReportsTopWorkerView = {
  rank: number;
  name: string;
  initials: string;
  role: string;
  metric: string;
  delta: string;
};

export type ReportsSeasonFlowPoint = { week: number; applied: number; hired: number };

type ReportsOverviewResponse = {
  kpis: { key: string; value: string; delta: string; sub: string }[];
  byJobType: ReportsByJobTypeView[];
  topWorkers: { rank: number; workerUserId: string; name: string; initials: string; role: string; metric: string; delta: string }[];
  seasonFlow: ReportsSeasonFlowPoint[];
};

const KPI_LABELS: Record<string, string> = {
  hires: 'Hires this season',
  time_to_fill: 'Avg time-to-fill',
  cost_per_hire: 'Cost per hire',
  retention_30d: 'Retention · 30 d',
};

const MOCK_REPORTS = {
  kpis: [
    { label: 'Hires this season', value: '83',     delta: '+18 YoY',  sub: '14 active crews' },
    { label: 'Avg time-to-fill',  value: '2.4 d',  delta: '-1.7 d YoY', sub: 'County avg 6.1 d' },
    { label: 'Cost per hire',     value: '$42',    delta: '-$28 YoY', sub: 'incl. SMS, broadcast' },
    { label: 'Retention · 30 d',  value: '88%',    delta: '+12 pts YoY', sub: '5 of 41 left early' },
  ],
  byJobType: [
    { label: 'Grape Harvest',    applied: 142, hired: 38, fillPct: 100 },
    { label: 'Almond Pre-shake', applied: 86,  hired: 21, fillPct: 87 },
    { label: 'Vineyard Setup',   applied: 64,  hired: 14, fillPct: 92 },
    { label: 'Sort Line',        applied: 58,  hired: 16, fillPct: 100 },
    { label: 'Almond Sweep',     applied: 28,  hired: 0,  fillPct: 0 },
  ],
  topWorkers: [
    { rank: 1, name: 'Miguel Reyes',     initials: 'MR', role: 'Crew A · Lead',    metric: '4,820 lb/day', delta: '+18%' },
    { rank: 2, name: 'Carmen Rojas',     initials: 'CR', role: 'Crew A · Picker',  metric: '4,210 lb/day', delta: '+12%' },
    { rank: 3, name: 'Tomás Ríos',       initials: 'TR', role: 'Crew C · Foreman', metric: '3,980 lb/day', delta: '+9%' },
    { rank: 4, name: 'Ana Castillo',     initials: 'AC', role: 'Crew C · Setup',   metric: '3,640 lb/day', delta: '+7%' },
    { rank: 5, name: 'Joaquín Núñez',    initials: 'JN', role: 'Crew B · Sort',    metric: '3,520 lb/day', delta: '+5%' },
  ],
  seasonFlow: [40, 56, 78, 92, 110, 128, 142, 156, 168, 152, 138, 120, 102, 88, 72, 84, 110, 138, 168, 184, 172, 158]
    .map((applied, i) => ({
      week: i + 1,
      applied,
      hired: Math.round(applied * 0.43),
    })),
};

export async function getReportsOverview(): Promise<{
  kpis: ReportsKpiView[];
  byJobType: ReportsByJobTypeView[];
  topWorkers: ReportsTopWorkerView[];
  seasonFlow: ReportsSeasonFlowPoint[];
}> {
  if (!apiConfigured()) return MOCK_REPORTS;
  try {
    const client = await getServerApiClient();
    const res = await client.get<ReportsOverviewResponse>('/v1/employer/reports/overview', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return MOCK_REPORTS;
    // Empty real metrics are truth — render zero cards instead of fake fixtures.
    return {
      kpis: res.data.kpis.map((k) => ({
        label: KPI_LABELS[k.key] ?? k.key,
        value: k.value,
        delta: k.delta,
        sub: k.sub,
      })),
      byJobType: res.data.byJobType,
      topWorkers: res.data.topWorkers.map((w) => ({
        rank: w.rank,
        name: w.name,
        initials: w.initials,
        role: w.role,
        metric: w.metric,
        delta: w.delta,
      })),
      seasonFlow: res.data.seasonFlow,
    };
  } catch {
    return MOCK_REPORTS;
  }
}
