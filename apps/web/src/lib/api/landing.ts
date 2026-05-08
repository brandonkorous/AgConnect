import 'server-only';

export type FeaturedJob = {
  id: string;
  seoSlug: string | null;
  titleEn: string;
  titleEs: string;
  county: string;
  wageMin: number;
  wageMax: number;
  wageUnit: 'hour' | 'day' | 'piece' | string;
  startDate: string;
  employerName: string;
  employerVerified: true;
  skills: string[];
  publishedAt: string | null;
};

export type FeaturedProgram = {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  funder: string;
  county: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledCount: number;
  spotsLeft: number;
  orgName: string;
  locationName: string;
};

export type Impact = {
  workersPlaced: number | null;
  medianWage: number | null;
  trainingsCompleted: number | null;
  verifiedEmployers: number;
  generatedAt: string;
  windowMonths: 12;
  source: string;
};

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');

async function fetchEnvelope<T>(path: string, revalidateSeconds: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: revalidateSeconds } });
    if (!res.ok) return null;
    const body = (await res.json()) as { ok: boolean; data?: T };
    return body.ok && body.data ? body.data : null;
  } catch {
    return null;
  }
}

export async function getFeaturedJobs(): Promise<FeaturedJob[]> {
  const data = await fetchEnvelope<{ jobs: FeaturedJob[] }>('/v1/landing/featured-jobs', 300);
  return data?.jobs ?? [];
}

export async function getFeaturedTraining(): Promise<FeaturedProgram[]> {
  const data = await fetchEnvelope<{ programs: FeaturedProgram[] }>('/v1/landing/featured-training', 600);
  return data?.programs ?? [];
}

export async function getImpact(): Promise<Impact | null> {
  return fetchEnvelope<Impact>('/v1/landing/impact', 86400);
}

export type FounderSlots = {
  remaining: number;
  total: number;
  active: boolean;
};

export async function getFounderSlots(): Promise<FounderSlots> {
  const data = await fetchEnvelope<FounderSlots>('/v1/landing/founder-slots', 30);
  return data ?? { remaining: 0, total: 50, active: false };
}
