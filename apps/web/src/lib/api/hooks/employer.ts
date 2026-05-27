'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import type { z } from 'zod';
import type { EmployerPlanTier, PlanInterval } from '@agconn/schemas';
import { BillingResponse } from '@agconn/schemas';
import { apiClient } from '../client';
import { ApiError } from '../unwrap';

export type EmployerProfileView = {
  id: string;
  legalName: string;
  dbaName: string | null;
  displayName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  licenseType: 'grower' | 'flc' | 'labor_contractor' | null;
  ein: string | null;
  flcLicenseNum: string | null;
  county: string | null;
  streetAddress: string | null;
  city: string | null;
  stateCode: string | null;
  postalCode: string | null;
  addressLat: number | null;
  addressLng: number | null;
  mapboxId: string | null;
  flcVerifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  participatesInH2a: boolean;
  dolLastInspectionAt: string | null;
  dolLastInspectionResult: 'pass' | 'fail' | 'pending' | null;
  plan: EmployerPlanTier;
  planInterval: PlanInterval | null;
  planCurrentPeriodEnd: string | null;
  planCancelAtPeriodEnd: boolean;
};

export type WageStructure = 'hourly' | 'hourly_piece' | 'piece';
export type PayFrequency = 'weekly' | 'biweekly' | 'daily';
export type MinExperience = 'none' | 'one_year' | 'three_years' | 'five_years';
export type MinAge = 'sixteen' | 'eighteen' | 'twenty_one';

export type JobPhotoView = {
  id: string;
  url: string;
  captionEn: string | null;
  captionEs: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

export type JobScreeningQuestionView = {
  id: string;
  sortOrder: number;
  questionEn: string;
  questionEs: string;
  answerType: 'yes_no' | 'text';
  required: boolean;
};

export type EmployerContactView = {
  id: string;
  name: string;
  phone: string;
  role: string;
  languages: ('en' | 'es')[];
  sortOrder: number;
};

export type LookupView = {
  id: string;
  slug: string;
  labelEn: string;
  labelEs: string;
  sortOrder: number;
};
export type CropLookupView = LookupView & { glyphKey: string };
export type SkillLookupView = LookupView & { category: string };

export type EmployerJobView = {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn?: string;
  descriptionEs?: string;
  county: string;
  city: string | null;
  wageMin: number;
  wageMax: number;
  startDate: string;
  endDate: string | null;
  status: 'draft' | 'active' | 'closed' | 'filled';
  positionsTotal: number;
  hireCount: number;
  applicationCounts: { applied: number; reviewed: number; hired: number; rejected: number };
  skills: string[];
  publishedAt?: string | null;
  filledAt?: string | null;
  closedAt?: string | null;
  createdAt?: string;
  cropId?: string | null;
  roleTypeId?: string | null;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  workingDays?: number;
  wageStructure?: WageStructure;
  pieceRate?: number | null;
  pieceUnit?: string | null;
  payFrequency?: PayFrequency;
  mealsProvided?: boolean;
  endOfSeasonBonusCents?: number | null;
  pickupPoint?: string | null;
  minExperience?: MinExperience;
  minAge?: MinAge;
  autoMatchEnabled?: boolean;
  autoTranslateEnabled?: boolean;
  renotifyPaused?: boolean;
  smsApplyEnabled?: boolean;
  smsApplyKeyword?: string | null;
  applicationDeadlineAt?: string | null;
  foremanContactId?: string | null;
  foremanContact?: EmployerContactView | null;
  siteAddress?: string | null;
  siteAcres?: number | null;
  siteLat?: number | null;
  siteLng?: number | null;
  zipCode?: string | null;
  humanId?: string | null;
  autosavedAt?: string | null;
  photos?: JobPhotoView[];
  screeningQuestions?: JobScreeningQuestionView[];
  housing?: boolean;
  transport?: boolean;
};

export type ApplicantCardView = {
  id: string;
  status: 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';
  appliedAt: string;
  job: { id: string; titleEn: string; titleEs: string; county: string };
  worker: {
    id: string;
    firstName: string;
    lastInitial: string;
    county: string | null;
    skills: string[];
    skillsMatchCount: number;
    certifications: { name: string; source: 'agconn' | 'self' }[];
  };
};

export type BillingView = z.infer<typeof BillingResponse>;

export type WorkerCardView = {
  id: string;
  firstName: string;
  lastInitial: string;
  lastName?: string;
  county: string | null;
  skills: string[];
  matchScore: number;
  certifications: { name: string; issuer: string | null; source: 'agconn' | 'self' }[];
  experienceCount: number;
  phone?: string;
  email?: string;
  relationship?: 'hired' | 'invited' | 'applied';
};

export type WorkerDetailView = WorkerCardView & {
  experience: unknown[];
  education: unknown[];
  languages: string[];
};

export type DashboardStats = {
  activePostings: number;
  applicantsThisWeek: number;
  openSeats: number;
  hiredThisSeason: number;
  spotsRemaining: number;
  avgTimeToFillDays: number | null;
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

const profileOptions = queryOptions({
  queryKey: ['employer', 'profile'] as const,
  queryFn: async (): Promise<EmployerProfileView | null> => {
    const data = await safeGetOrNull<{
      employer: EmployerProfileView;
      verificationStatus: 'pending' | 'verified' | 'rejected';
      rejectionReason: string | null;
    }>('/v1/employer/onboarding/me');
    return data?.employer ?? null;
  },
  staleTime: 5 * 60_000,
});

export function useEmployerProfile() {
  return useQuery(profileOptions);
}
export function useEmployerProfileSuspense() {
  return useSuspenseQuery(profileOptions);
}

const jobsOptions = queryOptions({
  queryKey: ['employer', 'jobs'] as const,
  queryFn: async (): Promise<EmployerJobView[]> => {
    const data = await safeGet<{ jobs: EmployerJobView[] }>('/v1/employer/jobs', { jobs: [] });
    return data.jobs;
  },
  staleTime: 60_000,
});

export function useEmployerJobs() {
  return useQuery(jobsOptions);
}
export function useEmployerJobsSuspense() {
  return useSuspenseQuery(jobsOptions);
}

function jobOptions(id: string) {
  return queryOptions({
    queryKey: ['employer', 'jobs', id] as const,
    queryFn: async (): Promise<EmployerJobView | null> => {
      const data = await safeGetOrNull<{ job: EmployerJobView }>(`/v1/employer/jobs/${id}`);
      return data?.job ?? null;
    },
    staleTime: 60_000,
  });
}

export function useEmployerJob(id: string) {
  return useQuery(jobOptions(id));
}
export function useEmployerJobSuspense(id: string) {
  return useSuspenseQuery(jobOptions(id));
}

const cropsOptions = queryOptions({
  queryKey: ['employer', 'lookups', 'crops'] as const,
  queryFn: async (): Promise<CropLookupView[]> => {
    const data = await safeGet<{ crops: CropLookupView[] }>('/v1/employer/lookups/crops', {
      crops: [],
    });
    return data.crops;
  },
  staleTime: 5 * 60_000,
});

export function useCrops() {
  return useQuery(cropsOptions);
}
export function useCropsSuspense() {
  return useSuspenseQuery(cropsOptions);
}

const roleTypesOptions = queryOptions({
  queryKey: ['employer', 'lookups', 'roleTypes'] as const,
  queryFn: async (): Promise<LookupView[]> => {
    const data = await safeGet<{ roleTypes: LookupView[] }>(
      '/v1/employer/lookups/role-types',
      { roleTypes: [] },
    );
    return data.roleTypes;
  },
  staleTime: 5 * 60_000,
});

export function useRoleTypes() {
  return useQuery(roleTypesOptions);
}
export function useRoleTypesSuspense() {
  return useSuspenseQuery(roleTypesOptions);
}

const skillsOptions = queryOptions({
  queryKey: ['employer', 'lookups', 'skills'] as const,
  queryFn: async (): Promise<SkillLookupView[]> => {
    const data = await safeGet<{ skills: SkillLookupView[] }>(
      '/v1/employer/lookups/skills',
      { skills: [] },
    );
    return data.skills;
  },
  staleTime: 5 * 60_000,
});

export function useSkillsLookup() {
  return useQuery(skillsOptions);
}
export function useSkillsLookupSuspense() {
  return useSuspenseQuery(skillsOptions);
}

const contactsOptions = queryOptions({
  queryKey: ['employer', 'contacts'] as const,
  queryFn: async (): Promise<EmployerContactView[]> => {
    const data = await safeGet<{ contacts: EmployerContactView[] }>(
      '/v1/employer/contacts',
      { contacts: [] },
    );
    return data.contacts;
  },
  staleTime: 60_000,
});

export function useEmployerContacts() {
  return useQuery(contactsOptions);
}
export function useEmployerContactsSuspense() {
  return useSuspenseQuery(contactsOptions);
}

const inboxOptions = queryOptions({
  queryKey: ['employer', 'inbox'] as const,
  queryFn: async (): Promise<ApplicantCardView[]> => {
    const data = await safeGet<{ applications: ApplicantCardView[] }>(
      '/v1/employer/inbox',
      { applications: [] },
    );
    return data.applications;
  },
  staleTime: 30_000,
});

export function useEmployerInbox() {
  return useQuery(inboxOptions);
}
export function useEmployerInboxSuspense() {
  return useSuspenseQuery(inboxOptions);
}

const billingOptions = queryOptions({
  queryKey: ['employer', 'billing'] as const,
  queryFn: async (): Promise<BillingView | null> =>
    safeGetOrNull<BillingView>('/v1/employer/billing'),
  staleTime: 60_000,
});

export function useEmployerBilling() {
  return useQuery(billingOptions);
}
export function useEmployerBillingSuspense() {
  return useSuspenseQuery(billingOptions);
}

function searchWorkersOptions(opts: { county?: string; q?: string } = {}) {
  return queryOptions({
    queryKey: ['employer', 'workers', 'search', opts.county ?? '', opts.q ?? ''] as const,
    queryFn: async (): Promise<WorkerCardView[]> => {
      const params = new URLSearchParams();
      if (opts.county) params.append('county', opts.county);
      if (opts.q) params.append('q', opts.q);
      const qs = params.toString();
      const data = await safeGet<{
        workers: WorkerCardView[];
        nextCursor: string | null;
      }>(`/v1/employer/workers${qs ? `?${qs}` : ''}`, {
        workers: [],
        nextCursor: null,
      });
      return data.workers;
    },
    staleTime: 60_000,
  });
}

export function useSearchWorkers(opts?: { county?: string; q?: string }) {
  return useQuery(searchWorkersOptions(opts));
}
export function useSearchWorkersSuspense(opts?: { county?: string; q?: string }) {
  return useSuspenseQuery(searchWorkersOptions(opts));
}

function workerDetailOptions(id: string) {
  return queryOptions({
    queryKey: ['employer', 'workers', 'detail', id] as const,
    queryFn: async (): Promise<WorkerDetailView | null> => {
      const data = await safeGetOrNull<{ worker: WorkerDetailView }>(
        `/v1/employer/workers/${id}`,
      );
      return data?.worker ?? null;
    },
    staleTime: 60_000,
  });
}

export function useWorkerDetail(id: string) {
  return useQuery(workerDetailOptions(id));
}
export function useWorkerDetailSuspense(id: string) {
  return useSuspenseQuery(workerDetailOptions(id));
}

const dashboardStatsOptions = queryOptions({
  queryKey: ['employer', 'dashboard', 'stats'] as const,
  queryFn: async (): Promise<DashboardStats> => {
    const jobsData = await safeGet<{ jobs: EmployerJobView[] }>('/v1/employer/jobs', { jobs: [] });
    const jobs = jobsData.jobs;
    const active = jobs.filter((j) => j.status === 'active');
    const filled = jobs.filter((j) => j.status === 'filled' && j.publishedAt && j.filledAt);
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let avgMs: number | null = null;
    if (filled.length > 0) {
      const total = filled.reduce(
        (sum, j) => sum + (new Date(j.filledAt!).getTime() - new Date(j.publishedAt!).getTime()),
        0,
      );
      avgMs = total / filled.length;
    }
    const inboxData = await safeGet<{ applications: ApplicantCardView[] }>(
      '/v1/employer/inbox',
      { applications: [] },
    );
    const inbox = inboxData.applications;
    const applicantsThisWeek = inbox.filter((a) => new Date(a.appliedAt).getTime() >= oneWeekAgo).length;
    return {
      activePostings: active.length,
      applicantsThisWeek,
      openSeats: active.reduce((sum, j) => sum + (j.positionsTotal - j.hireCount), 0),
      hiredThisSeason: jobs.reduce((sum, j) => sum + j.applicationCounts.hired, 0),
      spotsRemaining: jobs
        .filter((j) => j.status === 'active' || j.status === 'draft')
        .reduce((sum, j) => sum + (j.positionsTotal - j.hireCount), 0),
      avgTimeToFillDays:
        avgMs !== null ? Math.round((avgMs / (24 * 60 * 60 * 1000)) * 10) / 10 : null,
    };
  },
  staleTime: 60_000,
});

export function useDashboardStats() {
  return useQuery(dashboardStatsOptions);
}
export function useDashboardStatsSuspense() {
  return useSuspenseQuery(dashboardStatsOptions);
}

export function verificationStatus(p: EmployerProfileView): 'pending' | 'verified' | 'rejected' {
  if (p.flcVerifiedAt) return 'verified';
  if (p.rejectedAt) return 'rejected';
  return 'pending';
}

export type FounderSlots = {
  remaining: number;
  total: number;
  active: boolean;
};

const founderSlotsOptions = queryOptions({
  queryKey: ['landing', 'founder-slots'] as const,
  queryFn: async (): Promise<FounderSlots> =>
    safeGet<FounderSlots>('/v1/landing/founder-slots', {
      remaining: 0,
      total: 50,
      active: false,
    }),
  staleTime: 60_000,
});

export function useFounderSlots() {
  return useQuery(founderSlotsOptions);
}
export function useFounderSlotsSuspense() {
  return useSuspenseQuery(founderSlotsOptions);
}

// Reference to avoid unused import warning — ApiError shows up in stack traces.
export type { ApiError as _ApiError };
void ApiError;
