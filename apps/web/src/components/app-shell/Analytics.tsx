'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useConsent } from '@agconn/ui';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let posthogInitialized = false;

const initPostHog = () => {
  if (posthogInitialized || !POSTHOG_KEY || typeof window === 'undefined') return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: false,
    persistence: 'localStorage+cookie',
    loaded: (ph) => {
      if (process.env.NODE_ENV !== 'production') ph.debug(false);
    },
  });
  posthogInitialized = true;
};

const optOutPostHog = () => {
  if (!posthogInitialized) return;
  posthog.opt_out_capturing();
  posthog.stopSessionRecording();
};

const optInPostHog = () => {
  if (!POSTHOG_KEY) return;
  if (!posthogInitialized) initPostHog();
  posthog.opt_in_capturing();
};

export function Analytics({ children }: { children: React.ReactNode }) {
  const { choices, hasDecided } = useConsent();

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (!hasDecided) {
      optOutPostHog();
      return;
    }
    if (choices.analytics) optInPostHog();
    else optOutPostHog();
  }, [choices.analytics, hasDecided]);

  return POSTHOG_KEY ? (
    <PostHogProvider client={posthog}>
      <PageviewTracker />
      {children}
    </PostHogProvider>
  ) : (
    <>{children}</>
  );
}

function PageviewTracker() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { choices, hasDecided } = useConsent();

  useEffect(() => {
    if (!POSTHOG_KEY || !hasDecided || !choices.analytics) return;
    const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, params, choices.analytics, hasDecided]);

  return null;
}
