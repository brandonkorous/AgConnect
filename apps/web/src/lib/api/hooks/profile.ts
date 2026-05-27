'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type AvailabilityFlags = { weekdays: boolean; weekends: boolean };
export type SectionItem = { primary: string; secondary?: string; meta?: string };

export type ProfileSnapshot = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  zipCode: string | null;
  county: string | null;
  skills: string[];
  experience: SectionItem[];
  education: SectionItem[];
  certifications: SectionItem[];
  availability: AvailabilityFlags;
  updatedAt: string;
};

type ApiUser = { id: string; phone: string | null; email: string | null };
type ApiResume = {
  experience?: SectionItem[];
  education?: SectionItem[];
  certifications?: SectionItem[];
};
type ApiProfile = {
  firstName: string;
  lastName: string;
  zipCode: string | null;
  county: string | null;
  skills: string[];
  availability: unknown;
  resume: ApiResume | null;
  updatedAt: string;
};

function dayOpen(d: unknown): boolean {
  if (!d || typeof d !== 'object') return false;
  const v = d as { am?: unknown; pm?: unknown };
  return Boolean(v.am) || Boolean(v.pm);
}

function readAvailability(raw: unknown): AvailabilityFlags {
  if (!raw || typeof raw !== 'object') return { weekdays: false, weekends: false };
  const v = raw as Record<string, unknown>;
  return {
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'].some((k) => dayOpen(v[k])),
    weekends: ['sat', 'sun'].some((k) => dayOpen(v[k])),
  };
}

async function fetchProfile(): Promise<ProfileSnapshot> {
  const data = unwrap(
    await apiClient().get<{ user: ApiUser | null; workerProfile: ApiProfile }>(
      '/v1/profile',
    ),
  );
  const { user, workerProfile } = data;
  const resume = workerProfile.resume ?? {};
  return {
    firstName: workerProfile.firstName,
    lastName: workerProfile.lastName,
    email: user?.email ?? null,
    phone: user?.phone ?? null,
    zipCode: workerProfile.zipCode,
    county: workerProfile.county,
    skills: workerProfile.skills,
    experience: Array.isArray(resume.experience) ? resume.experience : [],
    education: Array.isArray(resume.education) ? resume.education : [],
    certifications: Array.isArray(resume.certifications) ? resume.certifications : [],
    availability: readAvailability(workerProfile.availability),
    updatedAt: workerProfile.updatedAt,
  };
}

const profileOptions = queryOptions({
  queryKey: qk.profile(),
  queryFn: fetchProfile,
  staleTime: 5 * 60_000,
});

export function useProfile() {
  return useQuery(profileOptions);
}
export function useProfileSuspense() {
  return useSuspenseQuery(profileOptions);
}
