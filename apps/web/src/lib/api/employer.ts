// Server-only employer data accessors.
//
// Calls the Hono API at services/api when authenticated; falls back to
// curated mock data when the API is unreachable or the user isn't signed in
// (dev convenience, so the UI is testable end-to-end without the API
// container running). Shapes mirror what services/api/employer/* returns so
// swapping to live data is automatic.

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
  flcVerifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  plan: EmployerPlanTier;
  planInterval: PlanInterval | null;
  planCurrentPeriodEnd: string | null;
  planCancelAtPeriodEnd: boolean;
};

export type EmployerJobView = {
  id: string;
  titleEn: string;
  titleEs: string;
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

const MOCK_EMPLOYER: EmployerProfileView = {
  id: 'emp-mock-1',
  legalName: 'Sunridge Vineyards LLC',
  dbaName: 'Sunridge Vineyards',
  displayName: 'Sunridge Vineyards',
  contactEmail: 'elena@sunridgevineyards.com',
  contactPhone: '+15595550123',
  licenseType: 'grower',
  ein: '12-3456789',
  flcLicenseNum: null,
  county: 'Madera',
  flcVerifiedAt: '2026-04-15T16:30:00Z',
  rejectedAt: null,
  rejectionReason: null,
  plan: 'pro',
  planInterval: 'monthly',
  planCurrentPeriodEnd: '2026-05-29T00:00:00Z',
  planCancelAtPeriodEnd: false,
};

const MOCK_JOBS: EmployerJobView[] = [
  {
    id: 'job-1',
    titleEn: 'Grape Harvest',
    titleEs: 'Cosecha de uva',
    county: 'Madera',
    city: 'Block 7-North',
    wageMin: 22.5,
    wageMax: 22.5,
    startDate: '2026-08-04',
    endDate: '2026-08-07',
    status: 'filled',
    positionsTotal: 14,
    hireCount: 14,
    applicationCounts: { applied: 24, reviewed: 14, hired: 14, rejected: 10 },
    skills: ['Harvesting', 'Bilingual'],
    publishedAt: '2026-04-28T15:00:00Z',
    filledAt: '2026-04-30T18:00:00Z',
    closedAt: null,
    createdAt: '2026-04-28T13:00:00Z',
  },
  {
    id: 'job-2',
    titleEn: 'Vineyard Setup Crew',
    titleEs: 'Cuadrilla de preparación de viñedo',
    county: 'Madera',
    city: 'Block 4-East',
    wageMin: 20,
    wageMax: 20,
    startDate: '2026-08-05',
    endDate: '2026-08-09',
    status: 'active',
    positionsTotal: 8,
    hireCount: 6,
    applicationCounts: { applied: 8, reviewed: 4, hired: 6, rejected: 2 },
    skills: ['Pruning', 'Forklift'],
    publishedAt: '2026-05-01T08:00:00Z',
    filledAt: null,
    closedAt: null,
    createdAt: '2026-05-01T07:00:00Z',
  },
  {
    id: 'job-3',
    titleEn: 'Almond Pre-shake Crew',
    titleEs: 'Cuadrilla pre-vareo de almendros',
    county: 'Madera',
    city: 'East orchard',
    wageMin: 21,
    wageMax: 21,
    startDate: '2026-08-08',
    endDate: '2026-08-15',
    status: 'active',
    positionsTotal: 12,
    hireCount: 3,
    applicationCounts: { applied: 14, reviewed: 5, hired: 3, rejected: 0 },
    skills: ['CDL-A', 'Forklift'],
    publishedAt: '2026-04-27T14:00:00Z',
    filledAt: null,
    closedAt: null,
    createdAt: '2026-04-27T12:00:00Z',
  },
  {
    id: 'job-4',
    titleEn: 'Sort Line — Day Shift',
    titleEs: 'Línea de selección — turno de día',
    county: 'Madera',
    city: 'Pack house',
    wageMin: 19,
    wageMax: 19,
    startDate: '2026-08-06',
    endDate: '2026-09-30',
    status: 'filled',
    positionsTotal: 8,
    hireCount: 8,
    applicationCounts: { applied: 22, reviewed: 8, hired: 8, rejected: 6 },
    skills: ['Packing', 'Bilingual'],
    publishedAt: '2026-04-24T16:00:00Z',
    filledAt: '2026-04-29T18:00:00Z',
    closedAt: null,
    createdAt: '2026-04-24T15:00:00Z',
  },
];

const MOCK_APPLICANTS: ApplicantCardView[] = [
  {
    id: 'app-1',
    status: 'applied',
    appliedAt: '2026-05-01T15:00:00Z',
    job: { id: 'job-3', titleEn: 'Almond Pre-shake Crew', titleEs: 'Cuadrilla pre-vareo de almendros', county: 'Madera' },
    worker: {
      id: 'usr-1',
      firstName: 'Pedro',
      lastInitial: 'E',
      county: 'Madera',
      skills: ['Forklift', 'Bilingual', 'WPS'],
      skillsMatchCount: 2,
      certifications: [{ name: 'WPS', source: 'agconn' }],
    },
  },
  {
    id: 'app-2',
    status: 'applied',
    appliedAt: '2026-05-01T11:00:00Z',
    job: { id: 'job-2', titleEn: 'Vineyard Setup Crew', titleEs: 'Cuadrilla de preparación de viñedo', county: 'Madera' },
    worker: {
      id: 'usr-2',
      firstName: 'Soledad',
      lastInitial: 'S',
      county: 'Madera',
      skills: ['Forklift', 'WPS', 'Bilingual'],
      skillsMatchCount: 2,
      certifications: [{ name: 'Forklift', source: 'agconn' }],
    },
  },
  {
    id: 'app-3',
    status: 'applied',
    appliedAt: '2026-05-01T09:00:00Z',
    job: { id: 'job-2', titleEn: 'Vineyard Setup Crew', titleEs: 'Cuadrilla de preparación de viñedo', county: 'Madera' },
    worker: {
      id: 'usr-3',
      firstName: 'Beto',
      lastInitial: 'V',
      county: 'Madera',
      skills: ['Pruning', 'Bilingual'],
      skillsMatchCount: 1,
      certifications: [{ name: 'Pruning', source: 'self' }],
    },
  },
  {
    id: 'app-4',
    status: 'reviewed',
    appliedAt: '2026-04-30T20:00:00Z',
    job: { id: 'job-3', titleEn: 'Almond Pre-shake Crew', titleEs: 'Cuadrilla pre-vareo de almendros', county: 'Madera' },
    worker: {
      id: 'usr-4',
      firstName: 'Joaquín',
      lastInitial: 'N',
      county: 'Madera',
      skills: ['CDL-A', 'Bilingual', 'Forklift'],
      skillsMatchCount: 2,
      certifications: [{ name: 'CDL-A', source: 'self' }],
    },
  },
  {
    id: 'app-5',
    status: 'reviewed',
    appliedAt: '2026-04-30T15:00:00Z',
    job: { id: 'job-2', titleEn: 'Vineyard Setup Crew', titleEs: 'Cuadrilla de preparación de viñedo', county: 'Madera' },
    worker: {
      id: 'usr-5',
      firstName: 'Rosa',
      lastInitial: 'A',
      county: 'Madera',
      skills: ['Pruning', 'Bilingual'],
      skillsMatchCount: 1,
      certifications: [{ name: 'WPS', source: 'agconn' }],
    },
  },
  {
    id: 'app-6',
    status: 'hired',
    appliedAt: '2026-04-28T17:00:00Z',
    job: { id: 'job-1', titleEn: 'Grape Harvest', titleEs: 'Cosecha de uva', county: 'Madera' },
    worker: {
      id: 'usr-6',
      firstName: 'Miguel',
      lastInitial: 'R',
      county: 'Madera',
      skills: ['Harvesting', 'Bilingual'],
      skillsMatchCount: 2,
      certifications: [{ name: 'Harvesting', source: 'agconn' }],
    },
  },
  {
    id: 'app-7',
    status: 'hired',
    appliedAt: '2026-04-28T13:00:00Z',
    job: { id: 'job-1', titleEn: 'Grape Harvest', titleEs: 'Cosecha de uva', county: 'Madera' },
    worker: {
      id: 'usr-7',
      firstName: 'Carmen',
      lastInitial: 'R',
      county: 'Madera',
      skills: ['Harvesting', 'Bilingual'],
      skillsMatchCount: 2,
      certifications: [{ name: 'Harvesting', source: 'agconn' }],
    },
  },
];

const apiConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

export async function getEmployerProfile(): Promise<EmployerProfileView | null> {
  if (!apiConfigured()) return MOCK_EMPLOYER;
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      employer: EmployerProfileView;
      verificationStatus: 'pending' | 'verified' | 'rejected';
      rejectionReason: string | null;
    }>('/v1/employer/onboarding/me', { handleErrorInline: true });
    if (!isOk(res)) return null;
    return res.data.employer;
  } catch {
    return MOCK_EMPLOYER;
  }
}

export async function listEmployerJobs(): Promise<EmployerJobView[]> {
  if (!apiConfigured()) return MOCK_JOBS;
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ jobs: EmployerJobView[] }>('/v1/employer/jobs', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return MOCK_JOBS;
    return res.data.jobs;
  } catch {
    return MOCK_JOBS;
  }
}

export async function getEmployerJob(id: string): Promise<EmployerJobView | null> {
  if (!apiConfigured()) return MOCK_JOBS.find((j) => j.id === id) ?? null;
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ job: EmployerJobView }>(`/v1/employer/jobs/${id}`, {
      handleErrorInline: true,
    });
    if (!isOk(res)) return null;
    return res.data.job;
  } catch {
    return MOCK_JOBS.find((j) => j.id === id) ?? null;
  }
}

export async function listInbox(): Promise<ApplicantCardView[]> {
  if (!apiConfigured()) return MOCK_APPLICANTS;
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ applications: ApplicantCardView[] }>(
      '/v1/employer/inbox',
      { handleErrorInline: true },
    );
    if (!isOk(res)) return MOCK_APPLICANTS;
    return res.data.applications;
  } catch {
    return MOCK_APPLICANTS;
  }
}

export async function getBilling(): Promise<BillingView | null> {
  if (!apiConfigured()) {
    return {
      plan: 'pro',
      interval: 'monthly',
      currentPeriodEnd: '2026-05-29T00:00:00Z',
      cancelAtPeriodEnd: false,
      features: {
        activePostings: -1,
        workerSearch: true,
        priorityListing: true,
        multiUser: false,
        customCounties: false,
        brandedReports: false,
      },
      hasPaymentMethod: true,
      stripeConfigured: false,
    };
  }
  try {
    const client = await getServerApiClient();
    const res = await client.get<BillingView>('/v1/employer/billing', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return null;
    return res.data;
  } catch {
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
