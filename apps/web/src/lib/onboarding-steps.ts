import type { Route } from 'next';

// Single source of truth for worker onboarding step routes. The mobile-first
// canonical worker onboarding lives under /[locale]/field/onboarding/* — see
// docs/10-worker/99-field-mode.md. Routing every step link through this helper
// prevents per-component path drift across the 9-step flow.

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
  return `/${locale}/field/onboarding/${step}` as Route;
}
