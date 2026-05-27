import 'server-only';
import { getServerApiClient } from './server-client';

export type OnboardingDraft = {
  firstName: string | null;
  lastName: string | null;
  county: string | null;
  skills: string[] | null;
  availability: unknown | null;
};

const EMPTY_DRAFT: OnboardingDraft = {
  firstName: null,
  lastName: null,
  county: null,
  skills: null,
  availability: null,
};

// Merged SMS-side + WorkerProfile draft used to prefill the web wizard so a
// worker who started over SMS doesn't re-enter values. Errors fold to an
// empty draft — prefill is a best-effort enhancement, not a gate.
export async function fetchOnboardingDraft(): Promise<OnboardingDraft> {
  const api = await getServerApiClient();
  const res = await api.get<OnboardingDraft>('/v1/onboarding/draft', {
    handleErrorInline: true,
  });
  if (!res.ok) return EMPTY_DRAFT;
  return res.data;
}
