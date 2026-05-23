// Server-only data accessors for employer operations surfaces:
// crews & shifts, payroll, compliance, messages, reports.
//
// On error we return empty/null and log via console.error. Empty real data is
// treated as truth — onboarding seeds compliance items and a payroll period.

import 'server-only';
import { isOk } from '@agconn/api-client';
import { getServerApiClient } from './server-client';

// ───────────────────────────────────────────────── Crews & shifts

export type CrewColor = 'grape' | 'almond' | 'citrus' | 'tomato' | 'lettuce' | 'olive';
export type CrewType = 'harvest' | 'setup' | 'sort' | 'irrigation' | 'pruning' | 'general';
export type CrewCrop = 'grape' | 'almond' | 'citrus' | 'tomato' | 'lettuce' | 'strawberry';
export type CrewSkill = 'forklift' | 'cdl' | 'wps' | 'bilingual' | 'lead' | 'irrigation';

export type CrewCommsChannels = {
  groupChat?: boolean;
  smsDigest?: boolean;
  voiceBroadcast?: boolean;
};

export type CrewView = {
  id: string;
  tenantId: string;
  employerId: string;
  name: string;
  shortCode: string | null;
  crewType: CrewType | null;
  primaryCrop: CrewCrop | null;
  color: CrewColor;
  requiredSkills: CrewSkill[];
  baseWageCents: number | null;
  pieceRateCents: number | null;
  pieceRateUnit: string | null;
  foremanPremiumCents: number | null;
  commsChannels: CrewCommsChannels;
  foremanUserId: string | null;
  foremanName: string | null;
  jobId: string | null;
  jobTitle: string | null;
  memberCount: number;
  activeMemberCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrewMemberView = {
  id: string;
  crewId: string;
  workerUserId: string;
  firstName: string;
  lastInitial: string;
  role: 'lead' | 'member';
  joinedAt: string;
  leftAt: string | null;
};

export type CrewYieldPointView = { date: string; pieces: number };
export type CrewActivityEventView = {
  id: string;
  action: string;
  occurredAt: string;
  actorId: string | null;
};
export type CrewSkillCoverageView = {
  skill: CrewSkill;
  haveCount: number;
  totalCount: number;
};
export type CrewInsightsView = {
  yield: CrewYieldPointView[];
  activity: CrewActivityEventView[];
  skillCoverage: CrewSkillCoverageView[];
};

export type ShiftType = 'work' | 'training' | 'off' | 'holiday';

export type ShiftMetadata = {
  pickup?: { enabled: boolean; label?: string };
  equipmentProvided?: boolean;
  equipmentDetail?: string;
  lunchProvided?: boolean;
  lunchDetail?: string;
  safety?: {
    wpsCleared?: boolean;
    ppeBriefingDone?: boolean;
    emergencyContactsLoaded?: boolean;
    restroomNearby?: boolean;
  };
  notifications?: {
    smsEveningBefore?: boolean;
    foremanRollCall?: boolean;
  };
  heatAdvisoryAutoApply?: boolean;
  heatAdvisoryForecastF?: number;
};

export type ShiftView = {
  id: string;
  tenantId: string;
  employerId: string;
  crewId: string | null;
  crewName: string | null;
  jobId: string | null;
  shiftDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string | null;
  locationLabel: string;
  locationLat: number | null;
  locationLng: number | null;
  notes: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  shiftType: ShiftType;
  metadata: ShiftMetadata;
  assignedCount: number;
  confirmedCount: number;
  capacity: number | null;
};

export type ShiftAssignmentView = {
  id: string;
  shiftId: string;
  workerUserId: string;
  firstName: string;
  lastInitial: string;
  status: 'assigned' | 'confirmed' | 'declined' | 'no_show' | 'completed';
};

export async function getShift(
  id: string,
): Promise<{ shift: ShiftView; assignments: ShiftAssignmentView[] } | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      shift: ShiftView;
      assignments: ShiftAssignmentView[];
    }>(`/v1/employer/shifts/${id}`, { handleErrorInline: true });
    if (!isOk(res)) return null;
    return res.data;
  } catch (e) {
    console.error('getShift failed', e);
    return null;
  }
}

export async function listCrews(): Promise<CrewView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ crews: CrewView[] }>('/v1/employer/crews', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.crews;
  } catch (e) {
    console.error('listCrews failed', e);
    return [];
  }
}

export async function getCrew(
  id: string,
): Promise<{ crew: CrewView; members: CrewMemberView[] } | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ crew: CrewView; members: CrewMemberView[] }>(
      `/v1/employer/crews/${id}`,
      { handleErrorInline: true },
    );
    if (!isOk(res)) return null;
    return res.data;
  } catch (e) {
    console.error('getCrew failed', e);
    return null;
  }
}

export async function getCrewInsights(id: string): Promise<CrewInsightsView> {
  const empty: CrewInsightsView = { yield: [], activity: [], skillCoverage: [] };
  try {
    const client = await getServerApiClient();
    const res = await client.get<CrewInsightsView>(`/v1/employer/crews/${id}/insights`, {
      handleErrorInline: true,
    });
    if (!isOk(res)) return empty;
    return res.data;
  } catch (e) {
    console.error('getCrewInsights failed', e);
    return empty;
  }
}

export async function listShifts(opts?: {
  from?: Date;
  to?: Date;
  crewId?: string;
}): Promise<ShiftView[]> {
  // Anchor on the supplied `from` verbatim — only fall back to "this week"
  // when no anchor is provided. The crews page passes the navigated week
  // start; re-anchoring here would defeat week-prev/-next navigation.
  const fromDate = opts?.from ?? startOfWorkWeek(new Date());
  const toDate =
    opts?.to ?? new Date(fromDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  try {
    const client = await getServerApiClient();
    const params: Record<string, string> = {
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
    };
    if (opts?.crewId) params.crewId = opts.crewId;
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const res = await client.get<{ shifts: ShiftView[] }>(`/v1/employer/shifts?${qs}`, {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.shifts;
  } catch (e) {
    console.error('listShifts failed', e);
    return [];
  }
}

export type ActiveHireView = {
  workerUserId: string;
  firstName: string;
  lastInitial: string;
  jobTitle: string;
  hiredAt: string;
};

export async function listActiveHires(): Promise<ActiveHireView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ workers: ActiveHireView[] }>('/v1/employer/hires', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.workers;
  } catch (e) {
    console.error('listActiveHires failed', e);
    return [];
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
  nonProductiveHours: number;
  restPeriodHours: number;
  regularPayCents: number;
  overtimePayCents: number;
  pieceRatePayCents: number;
  nonProductivePayCents: number;
  restPeriodPayCents: number;
  aewrTopUpCents: number;
  appliedFloorCents: number;
  isH2a: boolean;
  grossCents: number;
  bonusCents: number;
  netCents: number;
  approvedAt: string | null;
};

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
  nonProductiveHours: number;
  restPeriodHours: number;
  regularPayCents: number;
  overtimePayCents: number;
  pieceRatePayCents: number;
  nonProductivePayCents: number;
  restPeriodPayCents: number;
  aewrTopUpCents: number;
  appliedFloorCents: number;
  isH2a: boolean;
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

export type PayrollSeasonView = {
  netCents: number;
  grossCents: number;
  periods: number;
  uniqueWorkers: number;
  perPeriod: { startDate: string; netCents: number; isCurrent: boolean }[];
};

export async function listPayrollPeriods(): Promise<PayrollPeriodView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ periods: ApiPayrollPeriod[] }>(
      '/v1/employer/payroll/periods',
      { handleErrorInline: true },
    );
    if (!isOk(res)) return [];
    return res.data.periods.map((p) => ({
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      payDate: p.payDate,
      status: p.status,
      totals: p.totals,
    }));
  } catch (e) {
    console.error('listPayrollPeriods failed', e);
    return [];
  }
}

export async function getPayrollSeasonToDate(): Promise<PayrollSeasonView> {
  const periods = await listPayrollPeriods();
  if (periods.length === 0) {
    return { netCents: 0, grossCents: 0, periods: 0, uniqueWorkers: 0, perPeriod: [] };
  }
  // Drafts shouldn't roll into season-to-date earnings totals — those are real
  // money paid out. Counting drafts would inflate the figure with unfinalized
  // amounts. Drafts still appear on the per-period spark so the user can see
  // the upcoming bar.
  const finalized = periods.filter((p) => p.status !== 'draft');
  const netCents = finalized.reduce((s, p) => s + p.totals.netCents, 0);
  const grossCents = finalized.reduce((s, p) => s + p.totals.grossCents, 0);
  const uniqueWorkers = Math.max(...periods.map((p) => p.totals.workers), 0);
  const perPeriod = [...periods]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(-14)
    .map((p) => ({
      startDate: p.startDate,
      netCents: p.totals.netCents,
      isCurrent: p.status === 'draft',
    }));
  return {
    netCents,
    grossCents,
    periods: finalized.length,
    uniqueWorkers,
    perPeriod,
  };
}

export async function getCurrentPayrollPeriod(): Promise<PayrollPeriodView> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ periods: ApiPayrollPeriod[] }>(
      '/v1/employer/payroll/periods',
      { handleErrorInline: true },
    );
    if (!isOk(res)) return emptyPayrollPeriod();
    if (res.data.periods.length === 0) {
      // Real authenticated employer with no periods yet — return a synthesized
      // empty draft period so the UI renders cleanly with zeros.
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
  } catch (e) {
    console.error('getCurrentPayrollPeriod failed', e);
    return emptyPayrollPeriod();
  }
}

export async function listPayrollLines(periodId?: string): Promise<PayrollLineView[]> {
  if (!periodId) return [];
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ lines: ApiPayrollLine[] }>(
      `/v1/employer/payroll/periods/${periodId}/lines`,
      { handleErrorInline: true },
    );
    if (!isOk(res)) return [];
    // Empty real data is truth — the period just hasn't been generated yet.
    return res.data.lines.map((l) => ({
      id: l.id,
      workerUserId: l.workerUserId,
      workerName: l.workerName || '—',
      workerInitials: l.workerInitials || '??',
      role: l.role ?? '',
      hours: l.hours,
      overtimeHours: l.overtimeHours,
      nonProductiveHours: l.nonProductiveHours,
      restPeriodHours: l.restPeriodHours,
      regularPayCents: l.regularPayCents,
      overtimePayCents: l.overtimePayCents,
      pieceRatePayCents: l.pieceRatePayCents,
      nonProductivePayCents: l.nonProductivePayCents,
      restPeriodPayCents: l.restPeriodPayCents,
      aewrTopUpCents: l.aewrTopUpCents,
      appliedFloorCents: l.appliedFloorCents,
      isH2a: l.isH2a,
      grossCents: l.grossCents,
      bonusCents: l.bonusCents,
      netCents: l.netCents,
      approvedAt: l.approvedAt,
    }));
  } catch (e) {
    console.error('listPayrollLines failed', e);
    return [];
  }
}

export type H2aPayrollContext = {
  participatesInH2a: boolean;
  aewrHourlyCents: number | null;
  stateCode: string;
  effectiveFrom: string | null;
  source: string | null;
};

export async function fetchH2aPayrollContext(): Promise<H2aPayrollContext | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<H2aPayrollContext>('/v1/employer/payroll/h2a-context', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return null;
    return res.data;
  } catch (e) {
    console.error('fetchH2aPayrollContext failed', e);
    return null;
  }
}

export type WageStatementView = {
  line: {
    id: string;
    hours: number;
    overtimeHours: number;
    nonProductiveHours: number;
    restPeriodHours: number;
    regularPayCents: number;
    overtimePayCents: number;
    pieceRatePayCents: number;
    nonProductivePayCents: number;
    restPeriodPayCents: number;
    aewrTopUpCents: number;
    appliedFloorCents: number;
    isH2a: boolean;
    grossCents: number;
    bonusCents: number;
    taxesCents: number;
    netCents: number;
  };
  period: {
    id: string;
    startDate: string;
    endDate: string;
    payDate: string;
    status: 'draft' | 'approved' | 'paid';
  };
  worker: { id: string; firstName: string; lastName: string };
  employer: {
    legalName: string;
    dbaName: string | null;
    streetAddress: string | null;
    city: string | null;
    stateCode: string | null;
    postalCode: string | null;
    flcLicenseNum: string | null;
  };
};

export async function fetchWageStatement(
  periodId: string,
  lineId: string,
): Promise<WageStatementView | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<WageStatementView>(
      `/v1/employer/payroll/periods/${periodId}/lines/${lineId}/wage-statement`,
      { handleErrorInline: true },
    );
    if (!isOk(res)) return null;
    return res.data;
  } catch (e) {
    console.error('fetchWageStatement failed', e);
    return null;
  }
}

// ───────────────────────────────────────────────── Compliance

export type ComplianceCategoryView = {
  key: string;
  label: string;
  score: number;
  items: ComplianceItemView[];
};

export type ComplianceEvidenceView = {
  fileName: string | null;
  contentType: string | null;
  size: number | null;
  downloadPath: string;
};

export type ComplianceInstructionsView = {
  why: string;
  how: string[];
  acceptableEvidence: string[];
  deadline: string | null;
  source: { label: string; url: string };
  extraSources?: { label: string; url: string }[];
  lastVerified: string;
};

export type ComplianceItemView = {
  id?: string;
  key: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  details: string;
  dueAt: string | null;
  evidenceUrl?: string | null;
  evidence?: ComplianceEvidenceView | null;
  instructions?: ComplianceInstructionsView | null;
};

type ApiComplianceItem = {
  id: string;
  category: string;
  itemKey: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  details: string | null;
  evidenceUrl: string | null;
  evidence: ComplianceEvidenceView | null;
  instructions: ComplianceInstructionsView | null;
  dueAt: string | null;
  resolvedAt: string | null;
};

type ApiComplianceCategory = {
  category: string;
  score: number;
  items: ApiComplianceItem[];
};

// Category labels are translated at render-time on the page using
// `compliance.category.<key>` translation keys — no English fallback in the
// data layer. If a translation is missing the key is rendered verbatim,
// which surfaces the gap rather than masking it.

export async function listComplianceCategories(): Promise<ComplianceCategoryView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      categories: ApiComplianceCategory[];
      actions: { id: string; severity: 'urgent' | 'soon'; label: string; details: string; dueAt: string | null }[];
    }>('/v1/employer/compliance/items', { handleErrorInline: true });
    if (!isOk(res)) return [];
    if (res.data.categories.length === 0) return [];
    return res.data.categories.map((c) => ({
      key: c.category,
      label: c.category, // Page translates via t(`category.${key}`).
      score: c.score,
      items: c.items.map((i) => ({
        id: i.id,
        key: i.itemKey,
        label: i.label,
        status: i.status,
        details: i.details ?? '',
        dueAt: i.dueAt,
        evidenceUrl: i.evidenceUrl,
        evidence: i.evidence,
        instructions: i.instructions,
      })),
    }));
  } catch (e) {
    console.error('listComplianceCategories failed', e);
    return [];
  }
}

export type ComplianceSummaryView = {
  overall: number;
  priorScore: number | null;
  priorSnapshotDate: string | null;
  delta: number | null;
  participatesInH2a: boolean;
  dolLastInspectionAt: string | null;
  dolLastInspectionResult: 'pass' | 'fail' | 'pending' | null;
};

export async function getComplianceSummary(): Promise<ComplianceSummaryView | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<ComplianceSummaryView>('/v1/employer/compliance/summary', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return null;
    return res.data;
  } catch (e) {
    console.error('getComplianceSummary failed', e);
    return null;
  }
}

export type ComplianceActionView = {
  id: string | null;
  severity: 'urgent' | 'soon';
  title: string;
  detail: string;
  cta: string;
  dueAt: string | null;
  evidenceUrl: string | null;
  evidence: ComplianceEvidenceView | null;
  instructions: ComplianceInstructionsView | null;
};

export async function listComplianceActions(): Promise<ComplianceActionView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      categories: ApiComplianceCategory[];
      actions: {
        id: string;
        severity: 'urgent' | 'soon';
        label: string;
        details: string;
        dueAt: string | null;
        evidenceUrl: string | null;
        evidence: ComplianceEvidenceView | null;
        instructions: ComplianceInstructionsView | null;
      }[];
    }>('/v1/employer/compliance/items', { handleErrorInline: true });
    if (!isOk(res)) return [];
    // Zero open actions is a real (good!) state — return an empty list.
    return res.data.actions.map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.label,
      detail: a.details,
      // CTA label is empty here; the page renders it via
      // t(`severity_cta.${severity}`) so it follows the request locale.
      cta: '',
      dueAt: a.dueAt,
      evidenceUrl: a.evidenceUrl,
      evidence: a.evidence,
      instructions: a.instructions,
    }));
  } catch (e) {
    console.error('listComplianceActions failed', e);
    return [];
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

export type BroadcastDeliverySummary = {
  queued: number;
  optedOut: number;
  noPhone: number;
};

export type MessageView = {
  id: string;
  threadId: string;
  senderRole: 'me' | 'them';
  body: string;
  whenLabel: string;
  /** Short-time label of when a counterparty read this message; null if unread. */
  readByOthersLabel: string | null;
  broadcastDelivery: BroadcastDeliverySummary | null;
};

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
  broadcastDelivery: BroadcastDeliverySummary | null;
};

export async function listThreads(folder: FolderKey = 'all'): Promise<{
  threads: MessageThreadView[];
  counts: FolderCounts;
}> {
  const empty = {
    threads: [] as MessageThreadView[],
    counts: { all: 0, candidates: 0, crew: 0, foremen: 0, broadcasts: 0 } as FolderCounts,
  };
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      conversations: ApiConversation[];
      counts: FolderCounts;
    }>(`/v1/employer/messages?folder=${folder}`, { handleErrorInline: true });
    if (!isOk(res)) return empty;
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
  } catch (e) {
    console.error('listThreads failed', e);
    return empty;
  }
}

type CounterpartyRead = { userId: string; lastReadAt: string | null };

export async function listMessages(threadId: string, employerUserId?: string): Promise<MessageView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      messages: ApiMessage[];
      counterpartiesRead: CounterpartyRead[];
    }>(`/v1/employer/messages/${threadId}/messages`, { handleErrorInline: true });
    if (!isOk(res)) return [];
    const latestRead = (res.data.counterpartiesRead ?? [])
      .map((c) => (c.lastReadAt ? new Date(c.lastReadAt).getTime() : 0))
      .reduce((max, t) => (t > max ? t : max), 0);
    return res.data.messages.map((m) => {
      const senderIsMe = !!(employerUserId && m.senderUserId === employerUserId);
      const sentAt = new Date(m.createdAt).getTime();
      const readByOthersLabel =
        senderIsMe && latestRead > 0 && latestRead >= sentAt
          ? shortTime(new Date(latestRead).toISOString())
          : null;
      return {
        id: m.id,
        threadId: m.conversationId,
        senderRole: senderIsMe ? 'me' : 'them',
        body: m.body,
        whenLabel: shortTime(m.createdAt),
        readByOthersLabel,
        broadcastDelivery: m.broadcastDelivery,
      };
    });
  } catch (e) {
    console.error('listMessages failed', e);
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
  key: string;
  value: string;
  delta: string;
  sub: string | null;
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

export async function getReportsOverview(): Promise<{
  kpis: ReportsKpiView[];
  byJobType: ReportsByJobTypeView[];
  topWorkers: ReportsTopWorkerView[];
  seasonFlow: ReportsSeasonFlowPoint[];
}> {
  const empty = { kpis: [] as ReportsKpiView[], byJobType: [], topWorkers: [], seasonFlow: [] };
  try {
    const client = await getServerApiClient();
    const res = await client.get<ReportsOverviewResponse>('/v1/employer/reports/overview', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return empty;
    // Empty real metrics are truth — render zero cards instead of fake fixtures.
    return {
      kpis: res.data.kpis.map((k) => ({
        key: k.key,
        value: k.value,
        delta: k.delta,
        sub: k.sub ?? null,
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
  } catch (e) {
    console.error('getReportsOverview failed', e);
    return empty;
  }
}
