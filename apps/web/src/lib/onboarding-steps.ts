import type { Route } from 'next';

// Single source of truth for worker onboarding step routes. The flow exists in
// two parallel shells:
//   - /[locale]/field/onboarding/*  — mobile-first canonical
//   - /[locale]/worker/onboarding/* — desktop responsive split-shell
// See docs/10-worker/99-field-mode.md. Routing every step link through this
// helper prevents per-component path drift across both shells.

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
export type OnboardingShell = 'field' | 'worker';

export function onboardingPath(
  locale: string,
  step: OnboardingStep,
  shell: OnboardingShell = 'field',
): Route {
  return `/${locale}/${shell}/onboarding/${step}` as Route;
}
