import 'server-only';
import { getServerApiClient } from './server-client';
import type { OnboardingStep } from '@/lib/onboarding-steps';

export type ApiNextStep =
  | 'language'
  | 'resume_upload'
  | 'profile_review'
  | 'county'
  | 'skills'
  | 'availability'
  | 'complete';

export type OnboardingDraft = {
  firstName: string | null;
  lastName: string | null;
  county: string | null;
  skills: string[] | null;
  availability: unknown | null;
  nextStep: ApiNextStep;
};

const EMPTY_DRAFT: OnboardingDraft = {
  firstName: null,
  lastName: null,
  county: null,
  skills: null,
  availability: null,
  nextStep: 'language',
};

// Maps the API's onboarding-step vocabulary to the web wizard's URL slugs.
// Both shells (/field/onboarding and /worker/onboarding) use the same slugs.
export function apiNextStepToWebStep(step: ApiNextStep): OnboardingStep {
  switch (step) {
    case 'language':
      return 'welcome';
    case 'resume_upload':
      return 'resume';
    case 'profile_review':
      return 'profile';
    case 'county':
      return 'county';
    case 'skills':
      return 'skills';
    case 'availability':
      return 'availability';
    case 'complete':
      return 'complete';
  }
}

// Merged SMS-side + WorkerProfile draft used to prefill the web wizard so a
// worker who started over SMS doesn't re-enter values, plus the next-step
// pointer so the index page can skip ahead. Errors fold to an empty draft —
// prefill is a best-effort enhancement, not a gate.
export async function fetchOnboardingDraft(): Promise<OnboardingDraft> {
  const api = await getServerApiClient();
  const res = await api.get<OnboardingDraft>('/v1/onboarding/draft', {
    handleErrorInline: true,
  });
  if (!res.ok) return EMPTY_DRAFT;
  return res.data;
}
