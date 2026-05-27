'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';

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
  shiftDate: string;
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

export type ActiveHireView = {
  workerUserId: string;
  firstName: string;
  lastInitial: string;
  jobTitle: string;
  hiredAt: string;
};

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

export type PayrollSeasonView = {
  netCents: number;
  grossCents: number;
  periods: number;
  uniqueWorkers: number;
  perPeriod: { startDate: string; netCents: number; isCurrent: boolean }[];
};

export type H2aPayrollContext = {
  participatesInH2a: boolean;
  aewrHourlyCents: number | null;
  stateCode: string;
  effectiveFrom: string | null;
  source: string | null;
};

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

export type ComplianceCategoryView = {
  key: string;
  label: string;
  score: number;
  items: ComplianceItemView[];
};

export type ComplianceSummaryView = {
  overall: number;
  priorScore: number | null;
  priorSnapshotDate: string | null;
  delta: number | null;
  participatesInH2a: boolean;
  dolLastInspectionAt: string | null;
  dolLastInspectionResult: 'pass' | 'fail' | 'pending' | null;
};

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
  readByOthersLabel: string | null;
  broadcastDelivery: BroadcastDeliverySummary | null;
};

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

export type ReportsOverview = {
  kpis: ReportsKpiView[];
  byJobType: ReportsByJobTypeView[];
  topWorkers: ReportsTopWorkerView[];
  seasonFlow: ReportsSeasonFlowPoint[];
};

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  const res = await apiClient().get<T>(path, { handleErrorInline: true });
  if (!res.ok) return fallback;
  return res.data;
}

async function safeGetOrNull<T>(path: string): Promise<T | null> {
  const res = await apiClient().get<T>(path, { handleErrorInline: true });
  if (!res.ok) return null;
  return res.data;
}

export function startOfWorkWeek(d: Date): Date {
  const dow = d.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const out = new Date(d);
  out.setUTCDate(d.getUTCDate() + offset);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function shiftOptions(id: string) {
  return queryOptions({
    queryKey: ['employer', 'shifts', 'detail', id] as const,
    queryFn: async (): Promise<{ shift: ShiftView; assignments: ShiftAssignmentView[] } | null> =>
      safeGetOrNull<{ shift: ShiftView; assignments: ShiftAssignmentView[] }>(
        `/v1/employer/shifts/${id}`,
      ),
    staleTime: 30_000,
  });
}

export function useShift(id: string) {
  return useQuery(shiftOptions(id));
}
export function useShiftSuspense(id: string) {
  return useSuspenseQuery(shiftOptions(id));
}

const crewsOptions = queryOptions({
  queryKey: ['employer', 'crews'] as const,
  queryFn: async (): Promise<CrewView[]> => {
    const data = await safeGet<{ crews: CrewView[] }>('/v1/employer/crews', { crews: [] });
    return data.crews;
  },
  staleTime: 60_000,
});

export function useCrews() {
  return useQuery(crewsOptions);
}
export function useCrewsSuspense() {
  return useSuspenseQuery(crewsOptions);
}

function crewOptions(id: string) {
  return queryOptions({
    queryKey: ['employer', 'crews', 'detail', id] as const,
    queryFn: async (): Promise<{ crew: CrewView; members: CrewMemberView[] } | null> =>
      safeGetOrNull<{ crew: CrewView; members: CrewMemberView[] }>(`/v1/employer/crews/${id}`),
    staleTime: 60_000,
  });
}

export function useCrew(id: string) {
  return useQuery(crewOptions(id));
}
export function useCrewSuspense(id: string) {
  return useSuspenseQuery(crewOptions(id));
}

function crewInsightsOptions(id: string) {
  return queryOptions({
    queryKey: ['employer', 'crews', id, 'insights'] as const,
    queryFn: async (): Promise<CrewInsightsView> =>
      safeGet<CrewInsightsView>(`/v1/employer/crews/${id}/insights`, {
        yield: [],
        activity: [],
        skillCoverage: [],
      }),
    staleTime: 60_000,
  });
}

export function useCrewInsights(id: string) {
  return useQuery(crewInsightsOptions(id));
}
export function useCrewInsightsSuspense(id: string) {
  return useSuspenseQuery(crewInsightsOptions(id));
}

function shiftsOptions(opts: { from?: Date; to?: Date; crewId?: string } = {}) {
  const fromDate = opts.from ?? startOfWorkWeek(new Date());
  const toDate = opts.to ?? new Date(fromDate.getTime() + 13 * 24 * 60 * 60 * 1000);
  const fromKey = fromDate.toISOString().slice(0, 10);
  const toKey = toDate.toISOString().slice(0, 10);
  return queryOptions({
    queryKey: ['employer', 'shifts', fromKey, toKey, opts.crewId ?? ''] as const,
    queryFn: async (): Promise<ShiftView[]> => {
      const params: Record<string, string> = { from: fromKey, to: toKey };
      if (opts.crewId) params.crewId = opts.crewId;
      const qs = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      const data = await safeGet<{ shifts: ShiftView[] }>(`/v1/employer/shifts?${qs}`, {
        shifts: [],
      });
      return data.shifts;
    },
    staleTime: 60_000,
  });
}

export function useShifts(opts?: { from?: Date; to?: Date; crewId?: string }) {
  return useQuery(shiftsOptions(opts));
}
export function useShiftsSuspense(opts?: { from?: Date; to?: Date; crewId?: string }) {
  return useSuspenseQuery(shiftsOptions(opts));
}

const activeHiresOptions = queryOptions({
  queryKey: ['employer', 'hires'] as const,
  queryFn: async (): Promise<ActiveHireView[]> => {
    const data = await safeGet<{ workers: ActiveHireView[] }>('/v1/employer/hires', {
      workers: [],
    });
    return data.workers;
  },
  staleTime: 60_000,
});

export function useActiveHires() {
  return useQuery(activeHiresOptions);
}
export function useActiveHiresSuspense() {
  return useSuspenseQuery(activeHiresOptions);
}

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

const payrollPeriodsOptions = queryOptions({
  queryKey: ['employer', 'payroll', 'periods'] as const,
  queryFn: async (): Promise<PayrollPeriodView[]> => {
    const data = await safeGet<{ periods: ApiPayrollPeriod[] }>(
      '/v1/employer/payroll/periods',
      { periods: [] },
    );
    return data.periods.map((p) => ({
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      payDate: p.payDate,
      status: p.status,
      totals: p.totals,
    }));
  },
  staleTime: 60_000,
});

export function usePayrollPeriods() {
  return useQuery(payrollPeriodsOptions);
}
export function usePayrollPeriodsSuspense() {
  return useSuspenseQuery(payrollPeriodsOptions);
}

const payrollSeasonOptions = queryOptions({
  queryKey: ['employer', 'payroll', 'season'] as const,
  queryFn: async (): Promise<PayrollSeasonView> => {
    const data = await safeGet<{ periods: ApiPayrollPeriod[] }>(
      '/v1/employer/payroll/periods',
      { periods: [] },
    );
    const periods = data.periods.map((p) => ({
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      payDate: p.payDate,
      status: p.status,
      totals: p.totals,
    }));
    if (periods.length === 0) {
      return { netCents: 0, grossCents: 0, periods: 0, uniqueWorkers: 0, perPeriod: [] };
    }
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
    return { netCents, grossCents, periods: finalized.length, uniqueWorkers, perPeriod };
  },
  staleTime: 60_000,
});

export function usePayrollSeason() {
  return useQuery(payrollSeasonOptions);
}
export function usePayrollSeasonSuspense() {
  return useSuspenseQuery(payrollSeasonOptions);
}

const currentPayrollPeriodOptions = queryOptions({
  queryKey: ['employer', 'payroll', 'periods', 'current'] as const,
  queryFn: async (): Promise<PayrollPeriodView> => {
    const data = await safeGet<{ periods: ApiPayrollPeriod[] }>(
      '/v1/employer/payroll/periods',
      { periods: [] },
    );
    if (data.periods.length === 0) return emptyPayrollPeriod();
    const draft = data.periods.find((p) => p.status === 'draft');
    const p = draft ?? data.periods[0]!;
    return {
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      payDate: p.payDate,
      status: p.status,
      totals: p.totals,
    };
  },
  staleTime: 60_000,
});

export function useCurrentPayrollPeriod() {
  return useQuery(currentPayrollPeriodOptions);
}
export function useCurrentPayrollPeriodSuspense() {
  return useSuspenseQuery(currentPayrollPeriodOptions);
}

function payrollLinesOptions(periodId: string | undefined) {
  return queryOptions({
    queryKey: ['employer', 'payroll', 'lines', periodId ?? ''] as const,
    queryFn: async (): Promise<PayrollLineView[]> => {
      if (!periodId) return [];
      const data = await safeGet<{ lines: ApiPayrollLine[] }>(
        `/v1/employer/payroll/periods/${periodId}/lines`,
        { lines: [] },
      );
      return data.lines.map((l) => ({
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
    },
    staleTime: 60_000,
  });
}

export function usePayrollLines(periodId: string | undefined) {
  return useQuery(payrollLinesOptions(periodId));
}
export function usePayrollLinesSuspense(periodId: string | undefined) {
  return useSuspenseQuery(payrollLinesOptions(periodId));
}

const h2aContextOptions = queryOptions({
  queryKey: ['employer', 'payroll', 'h2a-context'] as const,
  queryFn: async (): Promise<H2aPayrollContext | null> =>
    safeGetOrNull<H2aPayrollContext>('/v1/employer/payroll/h2a-context'),
  staleTime: 5 * 60_000,
});

export function useH2aContext() {
  return useQuery(h2aContextOptions);
}
export function useH2aContextSuspense() {
  return useSuspenseQuery(h2aContextOptions);
}

function wageStatementOptions(periodId: string, lineId: string) {
  return queryOptions({
    queryKey: ['employer', 'payroll', 'wage-statement', periodId, lineId] as const,
    queryFn: async (): Promise<WageStatementView | null> =>
      safeGetOrNull<WageStatementView>(
        `/v1/employer/payroll/periods/${periodId}/lines/${lineId}/wage-statement`,
      ),
    staleTime: 60_000,
  });
}

export function useWageStatement(periodId: string, lineId: string) {
  return useQuery(wageStatementOptions(periodId, lineId));
}
export function useWageStatementSuspense(periodId: string, lineId: string) {
  return useSuspenseQuery(wageStatementOptions(periodId, lineId));
}

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

type ApiComplianceItemsResp = {
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
};

const complianceCategoriesOptions = queryOptions({
  queryKey: ['employer', 'compliance', 'categories'] as const,
  queryFn: async (): Promise<ComplianceCategoryView[]> => {
    const data = await safeGet<ApiComplianceItemsResp>('/v1/employer/compliance/items', {
      categories: [],
      actions: [],
    });
    return data.categories.map((c) => ({
      key: c.category,
      label: c.category,
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
  },
  staleTime: 60_000,
});

export function useComplianceCategories() {
  return useQuery(complianceCategoriesOptions);
}
export function useComplianceCategoriesSuspense() {
  return useSuspenseQuery(complianceCategoriesOptions);
}

const complianceActionsOptions = queryOptions({
  queryKey: ['employer', 'compliance', 'actions'] as const,
  queryFn: async (): Promise<ComplianceActionView[]> => {
    const data = await safeGet<ApiComplianceItemsResp>('/v1/employer/compliance/items', {
      categories: [],
      actions: [],
    });
    return data.actions.map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.label,
      detail: a.details,
      cta: '',
      dueAt: a.dueAt,
      evidenceUrl: a.evidenceUrl,
      evidence: a.evidence,
      instructions: a.instructions,
    }));
  },
  staleTime: 60_000,
});

export function useComplianceActions() {
  return useQuery(complianceActionsOptions);
}
export function useComplianceActionsSuspense() {
  return useSuspenseQuery(complianceActionsOptions);
}

const complianceSummaryOptions = queryOptions({
  queryKey: ['employer', 'compliance', 'summary'] as const,
  queryFn: async (): Promise<ComplianceSummaryView | null> =>
    safeGetOrNull<ComplianceSummaryView>('/v1/employer/compliance/summary'),
  staleTime: 60_000,
});

export function useComplianceSummary() {
  return useQuery(complianceSummaryOptions);
}
export function useComplianceSummarySuspense() {
  return useSuspenseQuery(complianceSummaryOptions);
}

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

function threadsOptions(folder: FolderKey) {
  return queryOptions({
    queryKey: ['employer', 'messages', 'threads', folder] as const,
    queryFn: async (): Promise<{ threads: MessageThreadView[]; counts: FolderCounts }> => {
      const empty = {
        threads: [] as MessageThreadView[],
        counts: { all: 0, candidates: 0, crew: 0, foremen: 0, broadcasts: 0 } as FolderCounts,
      };
      const data = await safeGet<{ conversations: ApiConversation[]; counts: FolderCounts }>(
        `/v1/employer/messages?folder=${folder}`,
        { conversations: [], counts: empty.counts },
      );
      return {
        threads: data.conversations.map((co) => ({
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
        counts: data.counts,
      };
    },
    staleTime: 10_000,
  });
}

export function useThreads(folder: FolderKey = 'all') {
  return useQuery(threadsOptions(folder));
}
export function useThreadsSuspense(folder: FolderKey = 'all') {
  return useSuspenseQuery(threadsOptions(folder));
}

type CounterpartyRead = { userId: string; lastReadAt: string | null };

function messagesOptions(threadId: string | null, employerUserId?: string) {
  return queryOptions({
    queryKey: ['employer', 'messages', 'thread', threadId ?? '', employerUserId ?? ''] as const,
    queryFn: async (): Promise<MessageView[]> => {
      if (!threadId) return [];
      const data = await safeGet<{
        messages: ApiMessage[];
        counterpartiesRead: CounterpartyRead[];
      }>(`/v1/employer/messages/${threadId}/messages`, {
        messages: [],
        counterpartiesRead: [],
      });
      const latestRead = (data.counterpartiesRead ?? [])
        .map((c) => (c.lastReadAt ? new Date(c.lastReadAt).getTime() : 0))
        .reduce((max, t) => (t > max ? t : max), 0);
      return data.messages.map((m) => {
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
    },
    staleTime: 5_000,
  });
}

export function useMessages(threadId: string | null, employerUserId?: string) {
  return useQuery(messagesOptions(threadId, employerUserId));
}
export function useMessagesSuspense(threadId: string | null, employerUserId?: string) {
  return useSuspenseQuery(messagesOptions(threadId, employerUserId));
}

const reportsOverviewOptions = queryOptions({
  queryKey: ['employer', 'reports', 'overview'] as const,
  queryFn: async (): Promise<ReportsOverview> => {
    const empty: ReportsOverview = { kpis: [], byJobType: [], topWorkers: [], seasonFlow: [] };
    type Resp = {
      kpis: { key: string; value: string; delta: string; sub: string }[];
      byJobType: ReportsByJobTypeView[];
      topWorkers: {
        rank: number;
        workerUserId: string;
        name: string;
        initials: string;
        role: string;
        metric: string;
        delta: string;
      }[];
      seasonFlow: ReportsSeasonFlowPoint[];
    };
    const data = await safeGet<Resp>('/v1/employer/reports/overview', {
      kpis: [],
      byJobType: [],
      topWorkers: [],
      seasonFlow: [],
    });
    if (data.kpis.length === 0 && data.byJobType.length === 0) return empty;
    return {
      kpis: data.kpis.map((k) => ({
        key: k.key,
        value: k.value,
        delta: k.delta,
        sub: k.sub ?? null,
      })),
      byJobType: data.byJobType,
      topWorkers: data.topWorkers.map((w) => ({
        rank: w.rank,
        name: w.name,
        initials: w.initials,
        role: w.role,
        metric: w.metric,
        delta: w.delta,
      })),
      seasonFlow: data.seasonFlow,
    };
  },
  staleTime: 60_000,
});

export function useReportsOverview() {
  return useQuery(reportsOverviewOptions);
}
export function useReportsOverviewSuspense() {
  return useSuspenseQuery(reportsOverviewOptions);
}
