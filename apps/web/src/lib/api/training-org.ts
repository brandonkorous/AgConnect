import 'server-only';
import { getServerApiClient } from './server-client';

export type ProgramCardView = {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  summaryEn: string | null;
  summaryEs: string | null;
  funder: string;
  county: string;
  capacity: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  topics: string[];
  status: 'draft' | 'active' | 'full' | 'closed' | 'canceled';
  certName: string | null;
};

export type ProgramFullView = ProgramCardView & {
  descriptionEn: string;
  descriptionEs: string;
  locationName: string;
  locationAddress: string;
  sessionTimes: { start: string; end: string; notes?: string }[];
};

export type RosterEnrollmentView = {
  id: string;
  programId: string;
  status: 'enrolled' | 'completed' | 'dropped';
  enrolledAt: string;
  completedAt: string | null;
  droppedAt: string | null;
  certificateId: string | null;
  certUrl: string | null;
  noShow: boolean;
  workerName: string;
  workerPhone: string | null;
  workerEmail: string | null;
};

export async function listOrgPrograms(): Promise<ProgramCardView[]> {
  const api = await getServerApiClient();
  const res = await api.get<{ programs: ProgramCardView[] }>('/v1/org/training', {
    handleErrorInline: true,
  });
  if (!res.ok) {
    console.error('[training-org] listOrgPrograms failed', res.error);
    return [];
  }
  return res.data.programs;
}

export async function getOrgProgram(id: string): Promise<ProgramFullView | null> {
  const api = await getServerApiClient();
  const res = await api.get<{ program: ProgramFullView }>(
    `/v1/org/training/${encodeURIComponent(id)}`,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    if (res.error.code !== 'not_found') {
      console.error('[training-org] getOrgProgram failed', res.error);
    }
    return null;
  }
  return res.data.program;
}

export async function getOrgRoster(programId: string): Promise<RosterEnrollmentView[]> {
  const api = await getServerApiClient();
  const res = await api.get<{ enrollments: RosterEnrollmentView[] }>(
    `/v1/org/training/${encodeURIComponent(programId)}/roster`,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    console.error('[training-org] getOrgRoster failed', res.error);
    return [];
  }
  return res.data.enrollments;
}
