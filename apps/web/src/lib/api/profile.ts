import 'server-only';
import { getServerApiClient } from './server-client';

export type ProfileSnapshot = {
  firstName: string;
  lastName: string;
  email: string | null;
  zipCode: string | null;
  county: string | null;
  skills: string[];
  experience: SectionItem[];
  education: SectionItem[];
  certifications: SectionItem[];
  updatedAt: string;
};

export type SectionItem = {
  primary: string;
  secondary?: string;
  meta?: string;
};

type ApiUser = {
  id: string;
  role: string;
  preferredLang: 'en' | 'es';
  onboarded: boolean;
  phone: string | null;
  email: string | null;
};

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
  certifications: unknown;
  availability: unknown;
  resume: ApiResume | null;
  resumeRawUrl: string | null;
  onboardedAt: string | null;
  updatedAt: string;
};

const EMPTY_SNAPSHOT: ProfileSnapshot = {
  firstName: '',
  lastName: '',
  email: null,
  zipCode: null,
  county: null,
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  updatedAt: new Date(0).toISOString(),
};

export async function fetchProfile(): Promise<ProfileSnapshot> {
  const api = await getServerApiClient();
  const res = await api.get<{ user: ApiUser | null; workerProfile: ApiProfile }>(
    '/v1/profile',
    { handleErrorInline: true },
  );
  if (!res.ok) {
    // 401/403 surfaces an empty editor — page still renders so unauthenticated
    // dev/preview doesn't crash. Real sign-in flow handles the redirect.
    return EMPTY_SNAPSHOT;
  }
  const { user, workerProfile } = res.data;
  const resume = workerProfile.resume ?? {};
  return {
    firstName: workerProfile.firstName,
    lastName: workerProfile.lastName,
    email: user?.email ?? null,
    zipCode: workerProfile.zipCode,
    county: workerProfile.county,
    skills: workerProfile.skills,
    experience: Array.isArray(resume.experience) ? resume.experience : [],
    education: Array.isArray(resume.education) ? resume.education : [],
    certifications: Array.isArray(resume.certifications)
      ? resume.certifications
      : [],
    updatedAt: workerProfile.updatedAt,
  };
}
