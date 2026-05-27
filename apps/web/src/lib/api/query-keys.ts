// Typed query key factory.
//
// Why: prevents string-typo cache misses, enables surgical invalidation, and
// gives the type system something to lean on. Components and hooks both
// reference these keys instead of building arrays by hand.
//
// Grow this file as hooks are added. Keep keys grouped by domain.

export const qk = {
  // Caller identity
  me: () => ['me'] as const,
  myNavCounts: () => ['me', 'nav-counts'] as const,
  myShifts: () => ['me', 'shifts'] as const,
  myPay: () => ['me', 'pay'] as const,
  myMessageThreads: () => ['me', 'messages', 'threads'] as const,

  // Worker profile + onboarding draft
  profile: () => ['profile'] as const,
  onboardingDraft: () => ['onboarding', 'draft'] as const,

  // Jobs
  jobs: (filters?: unknown) => ['jobs', filters ?? null] as const,
  job: (jobId: string) => ['jobs', jobId] as const,
  recommendedJobs: (filters?: unknown) => ['jobs', 'recommended', filters ?? null] as const,
  savedSearches: () => ['saved-searches'] as const,

  // Applications
  applications: () => ['applications'] as const,

  // Employer-scoped
  employer: {
    workers: (filters?: unknown) => ['employer', 'workers', filters ?? null] as const,
    crews: () => ['employer', 'crews'] as const,
    shifts: (crewId?: string) => ['employer', 'shifts', crewId ?? null] as const,
    jobs: () => ['employer', 'jobs'] as const,
    applications: () => ['employer', 'applications'] as const,
    members: () => ['employer', 'members'] as const,
    profile: () => ['employer', 'profile'] as const,
  },

  // Admin-scoped (grow as needed)
  admin: {
    waitlist: () => ['admin', 'waitlist'] as const,
    flcQueue: () => ['admin', 'flc', 'queue'] as const,
  },
} as const;
