// Server-only employer data accessors.
//
// Mirrors lib/api/server.ts: returns mock data while we bring up the
// real data path. The shapes match what services/api employer/* returns
// so swapping to real fetches is a single-call substitution.

import type { EmployerPlanTier, PlanInterval } from '@agconn/schemas';

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
  },
];

const MOCK_APPLICANTS: ApplicantCardView[] = [
  {
    id: 'app-1',
    status: 'applied',
    appliedAt: '2026-04-30T15:00:00Z',
    job: { id: 'job-3', titleEn: 'Almond Pre-shake Crew', titleEs: 'Cuadrilla pre-vareo de almendros', county: 'Madera' },
    worker: {
      id: 'usr-1',
      firstName: 'Pedro',
      lastInitial: 'E',
      county: 'Madera',
      skills: ['Forklift', 'Bilingual'],
      skillsMatchCount: 2,
      certifications: [{ name: 'WPS', source: 'agconn' }],
    },
  },
  {
    id: 'app-2',
    status: 'applied',
    appliedAt: '2026-04-30T11:00:00Z',
    job: { id: 'job-2', titleEn: 'Vineyard Setup Crew', titleEs: 'Cuadrilla de preparación de viñedo', county: 'Madera' },
    worker: {
      id: 'usr-2',
      firstName: 'Soledad',
      lastInitial: 'S',
      county: 'Madera',
      skills: ['Forklift', 'WPS', 'Bilingual'],
      skillsMatchCount: 1,
      certifications: [{ name: 'Forklift', source: 'agconn' }],
    },
  },
  {
    id: 'app-3',
    status: 'reviewed',
    appliedAt: '2026-04-29T20:00:00Z',
    job: { id: 'job-3', titleEn: 'Almond Pre-shake Crew', titleEs: 'Cuadrilla pre-vareo de almendros', county: 'Madera' },
    worker: {
      id: 'usr-3',
      firstName: 'Joaquín',
      lastInitial: 'N',
      county: 'Madera',
      skills: ['CDL-A', 'Bilingual'],
      skillsMatchCount: 2,
      certifications: [{ name: 'CDL-A', source: 'self' }],
    },
  },
];

export async function getEmployerProfile(): Promise<EmployerProfileView | null> {
  return MOCK_EMPLOYER;
}

export async function listEmployerJobs(): Promise<EmployerJobView[]> {
  return MOCK_JOBS;
}

export async function getEmployerJob(id: string): Promise<EmployerJobView | null> {
  return MOCK_JOBS.find((j) => j.id === id) ?? null;
}

export async function listInbox(): Promise<ApplicantCardView[]> {
  return MOCK_APPLICANTS;
}

export type DashboardStats = {
  activePostings: number;
  applicantsThisWeek: number;
  openSeats: number;
  hiredThisSeason: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const jobs = await listEmployerJobs();
  const active = jobs.filter((j) => j.status === 'active');
  return {
    activePostings: active.length,
    applicantsThisWeek: jobs.reduce((sum, j) => sum + j.applicationCounts.applied + j.applicationCounts.reviewed, 0),
    openSeats: active.reduce((sum, j) => sum + (j.positionsTotal - j.hireCount), 0),
    hiredThisSeason: jobs.reduce((sum, j) => sum + j.applicationCounts.hired, 0),
  };
}

export function verificationStatus(p: EmployerProfileView): 'pending' | 'verified' | 'rejected' {
  if (p.flcVerifiedAt) return 'verified';
  if (p.rejectedAt) return 'rejected';
  return 'pending';
}
