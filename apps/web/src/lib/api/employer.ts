// Server-only employer data accessors.
//
// Calls the Hono API at services/api. On error we return null (single-record
// fetchers) or [] (list fetchers) and log via console.error so the failure
// surfaces in dev. Empty real data is treated as truth — never mocked.

import 'server-only';
import type { EmployerPlanTier, PlanInterval } from '@agconn/schemas';
import { isOk } from '@agconn/api-client';
import { getServerApiClient } from './server-client';

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

  // ── Edit-Job v2 fields (optional so the list/card endpoints stay lean) ──
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

export type BillingView = {
  plan: EmployerPlanTier;
  interval: PlanInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  features: {
    activePostings: number;
    workerSearch: boolean;
    priorityListing: boolean;
    multiUser: boolean;
    customCounties: boolean;
    brandedReports: boolean;
  };
  hasPaymentMethod: boolean;
  stripeConfigured: boolean;
};

export async function getEmployerProfile(): Promise<EmployerProfileView | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      employer: EmployerProfileView;
      verificationStatus: 'pending' | 'verified' | 'rejected';
      rejectionReason: string | null;
    }>('/v1/employer/onboarding/me', { handleErrorInline: true });
    if (!isOk(res)) return null;
    return res.data.employer;
  } catch (e) {
    console.error('getEmployerProfile failed', e);
    return null;
  }
}

export async function listEmployerJobs(): Promise<EmployerJobView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ jobs: EmployerJobView[] }>('/v1/employer/jobs', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.jobs;
  } catch (e) {
    console.error('listEmployerJobs failed', e);
    return [];
  }
}

export async function getEmployerJob(id: string): Promise<EmployerJobView | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ job: EmployerJobView }>(`/v1/employer/jobs/${id}`, {
      handleErrorInline: true,
    });
    if (!isOk(res)) return null;
    return res.data.job;
  } catch (e) {
    console.error('getEmployerJob failed', e);
    return null;
  }
}

// ───────────────────────────────────────────────── Lookups (Edit Job v2)

export async function listCrops(): Promise<CropLookupView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ crops: CropLookupView[] }>('/v1/employer/lookups/crops', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.crops;
  } catch (e) {
    console.error('listCrops failed', e);
    return [];
  }
}

export async function listRoleTypes(): Promise<LookupView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ roleTypes: LookupView[] }>('/v1/employer/lookups/role-types', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.roleTypes;
  } catch (e) {
    console.error('listRoleTypes failed', e);
    return [];
  }
}

export async function listSkills(): Promise<SkillLookupView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ skills: SkillLookupView[] }>('/v1/employer/lookups/skills', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.skills;
  } catch (e) {
    console.error('listSkills failed', e);
    return [];
  }
}

export async function listEmployerContacts(): Promise<EmployerContactView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ contacts: EmployerContactView[] }>('/v1/employer/contacts', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return [];
    return res.data.contacts;
  } catch (e) {
    console.error('listEmployerContacts failed', e);
    return [];
  }
}

export async function listInbox(): Promise<ApplicantCardView[]> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ applications: ApplicantCardView[] }>(
      '/v1/employer/inbox',
      { handleErrorInline: true },
    );
    if (!isOk(res)) return [];
    return res.data.applications;
  } catch (e) {
    console.error('listInbox failed', e);
    return [];
  }
}

export async function getBilling(): Promise<BillingView | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<BillingView>('/v1/employer/billing', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return null;
    return res.data;
  } catch (e) {
    console.error('getBilling failed', e);
    return null;
  }
}

// ───────────────────────────────────────────────── Worker search

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

export async function searchWorkers(opts?: {
  county?: string;
  q?: string;
}): Promise<WorkerCardView[]> {
  try {
    const client = await getServerApiClient();
    const params = new URLSearchParams();
    if (opts?.county) params.append('county', opts.county);
    if (opts?.q) params.append('q', opts.q);
    const qs = params.toString();
    const res = await client.get<{ workers: WorkerCardView[]; nextCursor: string | null }>(
      `/v1/employer/workers${qs ? `?${qs}` : ''}`,
      { handleErrorInline: true },
    );
    if (!isOk(res)) return [];
    return res.data.workers;
  } catch (e) {
    console.error('searchWorkers failed', e);
    return [];
  }
}

export async function getWorkerDetail(id: string): Promise<WorkerDetailView | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ worker: WorkerDetailView }>(
      `/v1/employer/workers/${id}`,
      { handleErrorInline: true },
    );
    if (!isOk(res)) return null;
    return res.data.worker;
  } catch (e) {
    console.error('getWorkerDetail failed', e);
    return null;
  }
}

export type DashboardStats = {
  activePostings: number;
  applicantsThisWeek: number;
  openSeats: number;
  hiredThisSeason: number;
  spotsRemaining: number;
  avgTimeToFillDays: number | null;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const jobs = await listEmployerJobs();
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

  const inbox = await listInbox().catch(() => [] as ApplicantCardView[]);
  const applicantsThisWeek = inbox.filter((a) => new Date(a.appliedAt).getTime() >= oneWeekAgo).length;

  return {
    activePostings: active.length,
    applicantsThisWeek,
    openSeats: active.reduce((sum, j) => sum + (j.positionsTotal - j.hireCount), 0),
    hiredThisSeason: jobs.reduce((sum, j) => sum + j.applicationCounts.hired, 0),
    spotsRemaining: jobs
      .filter((j) => j.status === 'active' || j.status === 'draft')
      .reduce((sum, j) => sum + (j.positionsTotal - j.hireCount), 0),
    avgTimeToFillDays: avgMs !== null ? Math.round((avgMs / (24 * 60 * 60 * 1000)) * 10) / 10 : null,
  };
}

export function verificationStatus(p: EmployerProfileView): 'pending' | 'verified' | 'rejected' {
  if (p.flcVerifiedAt) return 'verified';
  if (p.rejectedAt) return 'rejected';
  return 'pending';
}
