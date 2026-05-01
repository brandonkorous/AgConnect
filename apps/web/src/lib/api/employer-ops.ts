// Server-only data accessors for employer operations surfaces:
// crews & shifts, payroll, compliance, messages, reports.
//
// Currently mock-backed for compliance/payroll/messages/reports (those domains
// don't have full backends yet); crews & shifts hit the real API when Clerk
// is configured.

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
};

export async function getCurrentPayrollPeriod(): Promise<PayrollPeriodView> {
  return {
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
}

export async function listPayrollLines(): Promise<PayrollLineView[]> {
  return [
    { id: 'pl-1', workerUserId: 'usr-6', workerName: 'Miguel Reyes',     workerInitials: 'MR', role: 'Crew A · Lead',     hours: 52, overtimeHours: 12, grossCents: 132_550, bonusCents: 18_000, netCents: 118_420 },
    { id: 'pl-2', workerUserId: 'usr-7', workerName: 'Carmen Rojas',     workerInitials: 'CR', role: 'Crew A · Picker',   hours: 48, overtimeHours:  8, grossCents: 111_600, bonusCents:  9_200, netCents:  99_430 },
    { id: 'pl-3', workerUserId: 'usr-2', workerName: 'Soledad Saavedra', workerInitials: 'SS', role: 'Crew B · Sort',     hours: 45, overtimeHours:  5, grossCents:  94_550, bonusCents:      0, netCents:  83_820 },
    { id: 'pl-4', workerUserId: 'usr-3', workerName: 'Beto Villalobos',  workerInitials: 'BV', role: 'Crew B · Sort',     hours: 45, overtimeHours:  5, grossCents:  94_550, bonusCents:      0, netCents:  83_820 },
    { id: 'pl-5', workerUserId: 'usr-foreman-c', workerName: 'Tomás Ríos', workerInitials: 'TR', role: 'Crew C · Foreman',  hours: 48, overtimeHours:  8, grossCents: 129_600, bonusCents: 22_000, netCents: 116_240 },
    { id: 'pl-6', workerUserId: 'usr-5', workerName: 'Rosa Aguilar',     workerInitials: 'RA', role: 'Crew C · Setup',    hours: 40, overtimeHours:  0, grossCents:  80_000, bonusCents:  4_000, netCents:  71_250 },
  ];
}

// ───────────────────────────────────────────────── Compliance

export type ComplianceCategoryView = {
  key: string;
  label: string;
  score: number;
  items: ComplianceItemView[];
};

export type ComplianceItemView = {
  key: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  details: string;
  dueAt: string | null;
};

export async function listComplianceCategories(): Promise<ComplianceCategoryView[]> {
  return [
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
}

export type ComplianceActionView = {
  severity: 'urgent' | 'soon';
  title: string;
  detail: string;
  cta: string;
};

export async function listComplianceActions(): Promise<ComplianceActionView[]> {
  return [
    {
      severity: 'urgent',
      title: 'Two I-9s expiring within 30 days',
      detail: 'Pedro Estrella (May 29) · Tomás Ríos (Jun 1) — re-verify with current ID.',
      cta: 'Re-verify',
    },
    {
      severity: 'soon',
      title: 'H-2A housing inspection due Aug 22',
      detail: 'Annual housing inspection per 20 CFR 655.122 — schedule with CDPH 14 days in advance.',
      cta: 'Schedule',
    },
  ];
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
};

export type MessageView = {
  id: string;
  threadId: string;
  senderRole: 'me' | 'them';
  body: string;
  whenLabel: string;
};

export async function listThreads(): Promise<MessageThreadView[]> {
  return [
    { id: 't-1', name: 'Crew A — Grape Harvest', initials: 'A', preview: 'M. Vargas: Pickup at 5:30 AM, Hwy 99…', whenLabel: '8m', unread: 2, channel: 'app',       group: true },
    { id: 't-2', name: 'Pedro Estrella',         initials: 'PE', preview: 'You: Can you do Thu 9 AM interview?',     whenLabel: '32m', unread: 0, channel: 'sms',       group: false },
    { id: 't-3', name: 'Soledad Saavedra',       initials: 'SS', preview: 'Soledad: Yes, I have forklift cert…',      whenLabel: '2h',  unread: 1, channel: 'sms',       group: false },
    { id: 't-4', name: 'Manuel Vargas (Foreman)', initials: 'MV', preview: 'Manuel: Need 1 more for tomorrow',         whenLabel: '3h',  unread: 0, channel: 'whatsapp',  group: false },
    { id: 't-5', name: 'Almond Pre-shake applicants', initials: 'AP', preview: 'You: Job is still open — pay $21/hr…', whenLabel: '5h',  unread: 0, channel: 'broadcast', group: true },
    { id: 't-6', name: 'Joaquín Núñez',          initials: 'JN', preview: 'Joaquín: Available Mon-Sat',               whenLabel: 'Yest', unread: 0, channel: 'sms',       group: false },
    { id: 't-7', name: 'Rosa Aguilar',           initials: 'RA', preview: 'You: Welcome to the crew!',                 whenLabel: 'Yest', unread: 0, channel: 'app',       group: false },
  ];
}

export async function listMessages(threadId: string): Promise<MessageView[]> {
  if (threadId !== 't-1') {
    return [
      { id: 'm-x', threadId, senderRole: 'them', body: 'Hi Elena — just confirming for tomorrow\'s shift.',                whenLabel: '8:02 AM' },
      { id: 'm-y', threadId, senderRole: 'me',   body: 'Confirmed. See you at 6 AM.',                                       whenLabel: '8:05 AM' },
    ];
  }
  return [
    { id: 'm-1', threadId, senderRole: 'them', body: 'Buenos días Elena. Listo para mañana. Tengo 13 confirmados y uno me dijo que no puede.',                          whenLabel: '7:42 AM' },
    { id: 'm-2', threadId, senderRole: 'me',   body: 'Got it Manuel. Posting the 1 spot publicly now — should fill within an hour given how many applicants we have.', whenLabel: '7:44 AM' },
    { id: 'm-3', threadId, senderRole: 'them', body: 'Perfect. Pickup en Hwy 99 a las 5:30 AM, regresamos al campo Block 7-Norte. Llevo agua + carpa de sombra.',       whenLabel: '7:46 AM' },
    { id: 'm-4', threadId, senderRole: 'me',   body: 'Heat advisory says 102°F by 1 PM tomorrow. Push lunch to 11:30 and add a 10-min shade break at 9 AM and 1 PM.',  whenLabel: '7:48 AM' },
    { id: 'm-5', threadId, senderRole: 'them', body: '✓ Voy a avisar al equipo por WhatsApp. ¿Pago piezas hoy o se junta con el viernes?',                              whenLabel: '7:51 AM' },
    { id: 'm-6', threadId, senderRole: 'me',   body: 'Friday with payroll. Bonus rate is $0.18/lb — already loaded. See you at 5:30.',                                  whenLabel: '7:53 AM' },
  ];
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

export async function getReportsOverview(): Promise<{
  kpis: ReportsKpiView[];
  byJobType: ReportsByJobTypeView[];
  topWorkers: ReportsTopWorkerView[];
  seasonFlow: ReportsSeasonFlowPoint[];
}> {
  return {
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
}
