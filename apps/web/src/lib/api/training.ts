import 'server-only';
import { getServerApiClient } from './server-client';

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

export type ProgramDetail = ProgramCard & {
  descriptionEn: string;
  descriptionEs: string;
  locationName: string | null;
  locationAddress: string | null;
  sessionTimes: unknown;
  orgName: string;
  orgEmail: string | null;
};

export type ProgramDetailResponse = {
  program: ProgramDetail;
  enrollment: EnrollmentRow | null;
  spotsLeft: number;
};

export type EnrollmentRow = {
  id: string;
  status: 'enrolled' | 'completed' | 'dropped';
  enrolledAt: string;
  completedAt: string | null;
  droppedAt: string | null;
  certificateId: string | null;
  certUrl: string | null;
};

export type ProgramsPage = { programs: ProgramCard[]; nextCursor: string | null };

export async function fetchTrainingPrograms(query: {
  q?: string;
  county?: string[];
  funder?: string[];
  topics?: string[];
  hasCapacity?: boolean;
  startBefore?: string;
  startAfter?: string;
  cursor?: string | null;
  limit?: number;
} = {}): Promise<ProgramsPage> {
  const api = await getServerApiClient();
  const res = await api.get<ProgramsPage>('/v1/training', {
    query: {
      q: query.q,
      county: query.county,
      funder: query.funder,
      topics: query.topics,
      hasCapacity: query.hasCapacity,
      startBefore: query.startBefore,
      startAfter: query.startAfter,
      cursor: query.cursor ?? undefined,
      limit: query.limit ?? 20,
    },
    handleErrorInline: true,
  });
  if (!res.ok) return { programs: [], nextCursor: null };
  return res.data;
}

export async function fetchProgram(slug: string): Promise<ProgramDetailResponse | null> {
  const api = await getServerApiClient();
  const res = await api.get<ProgramDetailResponse>(`/v1/training/${encodeURIComponent(slug)}`, {
    handleErrorInline: true,
  });
  if (!res.ok) return null;
  return res.data;
}

export type EnrollmentListItem = EnrollmentRow & {
  program: ProgramCard;
};

export async function fetchEnrollments(
  status: 'all' | 'upcoming' | 'completed' | 'dropped' = 'all',
): Promise<EnrollmentListItem[]> {
  const api = await getServerApiClient();
  const res = await api.get<{ enrollments: EnrollmentListItem[] }>(
    '/v1/me/enrollments',
    { query: status === 'all' ? {} : { status }, handleErrorInline: true },
  );
  if (!res.ok) return [];
  return res.data.enrollments;
}
