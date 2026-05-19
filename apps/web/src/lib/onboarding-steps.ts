import type { Route } from 'next';

// Single source of truth for worker onboarding step routes. The flow moved
// from /[locale]/onboarding/* to /[locale]/worker/onboarding/*; routing every
// step link through this helper prevents the per-component path drift that
// 404'd the entire flow after the move. See
// docs/00-foundation/13-onboarding-identity-remediation/04-phase-2-worker-web.md.

export const ONBOARDING_STEPS = [
  'welcome',
  'language',
  'resume',
  'profile',
  'county',
  'skills',
  'availability',
  'complete',
  'waitlist',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function onboardingPath(locale: string, step: OnboardingStep): Route {
  return `/${locale}/worker/onboarding/${step}` as Route;
}
