// Server-only data accessors for worker surfaces.
//
// The Hono API at services/api owns the production data path. RSC reads here
// do not call out to it during early MVP — instead we serve curated mock data
// so the UI is testable end-to-end without the API container running. Swap
// these for real `fetch` calls (or direct @agconn/db reads via tenant
// middleware) once Phase 1 wires the worker domain.

import type { JobCardData } from '@/components/jobs/JobCard';

const MOCK_JOBS: JobCardData[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    seoSlug: 'fresno-strawberry-picker-spring-2026',
    titleEn: 'Strawberry Picker',
    titleEs: 'Cosechador de Fresas',
    county: 'Fresno',
    city: 'Selma',
    wageMin: 18,
    wageMax: 22,
    wageUnit: 'hour',
    startDate: '2026-05-12',
    endDate: '2026-07-30',
    employerName: 'Driscoll Madera Ranch',
    employerVerified: true,
    skills: ['Cosecha', 'Empaque'],
    housing: false,
    transport: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    seoSlug: 'kern-tractor-operator-summer-2026',
    titleEn: 'Tractor Operator',
    titleEs: 'Operador de Tractor',
    county: 'Kern',
    city: 'Bakersfield',
    wageMin: 24,
    wageMax: 28,
    wageUnit: 'hour',
    startDate: '2026-06-01',
    endDate: '2026-09-15',
    employerName: 'Wonderful Citrus',
    employerVerified: true,
    skills: ['Operación de tractor', 'Reparación de equipo'],
    housing: true,
    transport: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    seoSlug: 'tulare-pruning-crew-late-spring-2026',
    titleEn: 'Pruning Crew',
    titleEs: 'Cuadrilla de Poda',
    county: 'Tulare',
    city: 'Visalia',
    wageMin: 19,
    wageMax: 23,
    wageUnit: 'hour',
    startDate: '2026-05-20',
    endDate: '2026-06-30',
    employerName: 'Sun Pacific Farms',
    employerVerified: false,
    skills: ['Poda', 'Cuadrilla'],
    housing: false,
    transport: true,
  },
];

export async function fetchJobs(): Promise<JobCardData[]> {
  return MOCK_JOBS;
}

export async function fetchJob(slug: string): Promise<JobCardData | null> {
  return MOCK_JOBS.find((j) => j.seoSlug === slug) ?? null;
}

export type ApplicationListItem = {
  id: string;
  jobTitle: string;
  employer: string;
  appliedAt: string;
  status: 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';
  jobSlug: string;
};

export async function fetchApplications(): Promise<ApplicationListItem[]> {
  return [];
}

export type WalletItem =
  | {
      source: 'enrollment';
      id: string;
      certificateId: string;
      programTitleEn: string;
      programTitleEs: string;
      funder: string;
      orgName: string;
      completedAt: string;
      certUrl: string | null;
    }
  | {
      source: 'manual';
      id: string;
      name: string;
      issuer: string | null;
      issuedAt: string | null;
      expiresAt: string | null;
    };

export async function fetchWallet(): Promise<WalletItem[]> {
  return [];
}

export type ProgramCard = {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  funder: string;
  county: string;
  capacity: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  topics: string[];
  status: string;
};

export async function fetchTraining(): Promise<ProgramCard[]> {
  return [
    {
      id: 'p-1',
      seoSlug: 'tractor-safety-fresno-april-2026',
      titleEn: 'Tractor Safety Training',
      titleEs: 'Capacitación de Seguridad en Tractor',
      funder: 'CDFA',
      county: 'Fresno',
      capacity: 20,
      enrolledCount: 8,
      startDate: '2026-05-15T16:00:00.000Z',
      endDate: '2026-05-22T23:00:00.000Z',
      topics: ['tractor_safety', 'maintenance'],
      status: 'active',
    },
    {
      id: 'p-2',
      seoSlug: 'pesticide-application-tulare-may-2026',
      titleEn: 'Pesticide Application Certification',
      titleEs: 'Certificación de Aplicación de Pesticidas',
      funder: 'F3',
      county: 'Tulare',
      capacity: 15,
      enrolledCount: 12,
      startDate: '2026-05-25T16:00:00.000Z',
      endDate: '2026-06-05T23:00:00.000Z',
      topics: ['pesticide_application', 'safety'],
      status: 'active',
    },
  ];
}
