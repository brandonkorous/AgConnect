import 'server-only';
import { getServerApiClient } from './server-client';

export type AppStatus = 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';

export type ApplicationListItem = {
  id: string;
  status: AppStatus;
  wageOffered: number | null;
  workerNote: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  hiredAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  startDate: string | null;
  countyAtApply: string | null;
  skillsAtApply: string[];
  job: {
    id: string;
    seoSlug: string;
    titleEn: string;
    titleEs: string;
    county: string;
    wageMin: number;
    wageMax: number;
    startDate: string;
    employerName: string;
  };
};

export type ApplicationsPage = {
  applications: ApplicationListItem[];
  nextCursor: string | null;
};

export async function fetchApplications(
  status: 'all' | 'active' | 'hired' | 'closed' = 'all',
): Promise<ApplicationsPage> {
  const api = await getServerApiClient();
  const res = await api.get<ApplicationsPage>('/v1/applications', {
    query: {
      // The API schema only accepts active|hired|closed; 'all' means no filter.
      ...(status !== 'all' ? { status } : {}),
      limit: 50,
    },
    handleErrorInline: true,
  });
  if (!res.ok) return { applications: [], nextCursor: null };
  return res.data;
}

export type ApplicationDetail = {
  application: ApplicationListItem;
  job: {
    id: string;
    seoSlug: string;
    titleEn: string;
    titleEs: string;
    descriptionEn: string;
    descriptionEs: string;
    county: string;
    wageMin: number;
    wageMax: number;
    startDate: string;
    endDate: string | null;
    status: string;
  };
  events: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorRole: string;
    metadata: unknown;
    createdAt: string;
  }[];
  employer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
};

export async function fetchApplication(id: string): Promise<ApplicationDetail | null> {
  const api = await getServerApiClient();
  const res = await api.get<ApplicationDetail>(`/v1/applications/${id}`, {
    handleErrorInline: true,
  });
  if (!res.ok) return null;
  return res.data;
}
