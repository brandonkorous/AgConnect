'use client';

import { usePathname } from 'next/navigation';
import type { OnboardingShell } from './onboarding-steps';

export function useOnboardingShell(): OnboardingShell {
  const pathname = usePathname() ?? '';
  return pathname.includes('/worker/onboarding') ? 'worker' : 'field';
}
