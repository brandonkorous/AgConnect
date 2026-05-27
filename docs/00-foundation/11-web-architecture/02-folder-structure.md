# Folder structure

Target structure after Foundation PR lands. Files in **bold** are new; files in *italics* change shape.

## `apps/web/src/`

```
apps/web/src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                          ← mounts <AppProviders>
│   │   ├── (marketing)/                        ← SSG/ISR, unchanged
│   │   ├── (auth)/                             ← SSR, unchanged
│   │   ├── worker/(shell)/
│   │   │   ├── layout.tsx                      ← thin server wrapper, no awaits
│   │   │   ├── WorkerShellClient.tsx           ← "use client", auth gate + chrome
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx                    ← thin, returns <DashboardClient />
│   │   │   │   └── DashboardClient.tsx         ← "use client", Suspense tree
│   │   │   ├── jobs/...
│   │   │   ├── applications/...
│   │   │   └── ...
│   │   ├── employer/(shell)/...                ← same shape
│   │   ├── admin/(shell)/...                   ← same shape
│   │   └── field/(shell)/...                   ← same shape, mobile-first
│   └── middleware.ts                           ← proxy: edge auth redirects
├── components/
│   ├── providers/
│   │   ├── AppProviders.tsx                    ← top-level provider stack
│   │   ├── QueryClientBridge.tsx               ← creates QueryClient, mounts devtools in dev
│   │   ├── ClerkTokenBridge.tsx                ← wires Clerk session → apiClient
│   │   └── ActiveEmployerProvider.tsx          ← multi-employer selection
│   ├── ui/
│   │   └── skeleton/
│   │       ├── Skeleton.tsx                    ← base block
│   │       ├── SkeletonCard.tsx
│   │       ├── SkeletonRow.tsx
│   │       ├── SkeletonChip.tsx
│   │       ├── SkeletonText.tsx
│   │       └── domain/
│   │           ├── SkeletonKpiRow.tsx          ← matches WorkerKpiRow shape
│   │           ├── SkeletonShiftCard.tsx
│   │           ├── SkeletonJobCard.tsx
│   │           └── SkeletonShell.tsx           ← full-page shell skeleton
│   ├── worker/...                              ← all become "use client"
│   ├── employer/...                            ← all become "use client"
│   └── admin/...                               ← all become "use client"
├── lib/
│   ├── api/
│   │   ├── client.ts                           ← THE browser apiClient instance
│   │   ├── unwrap.ts                           ← { ok, data } → data | throws
│   │   ├── token-store.ts                      ← singleton, populated by bridge
│   │   ├── query-keys.ts                       ← typed factory
│   │   ├── server-client.ts                    ← kept for auth/marketing pages only
│   │   └── hooks/
│   │       ├── index.ts                        ← barrel
│   │       ├── me.ts                           ← useMe, useUpdateMe
│   │       ├── profile.ts                      ← useProfile, useUpdateProfile
│   │       ├── jobs.ts                         ← useJobs, useRecommendedJobs
│   │       ├── applications.ts                 ← useApplications, useApply
│   │       ├── shifts.ts                       ← useMyShifts
│   │       ├── pay.ts                          ← useMyPay
│   │       ├── messages.ts                     ← useMessageThreads, useThread
│   │       ├── saved-searches.ts
│   │       ├── employer/
│   │       │   ├── jobs.ts
│   │       │   ├── shifts.ts
│   │       │   ├── workers.ts
│   │       │   └── ...
│   │       └── admin/
│   │           └── ...
│   └── context/
│       ├── ActiveEmployerContext.tsx
│       ├── RoleContext.tsx
│       └── ToastContext.tsx
└── hooks/
    ├── useDebounce.ts
    ├── useMediaQuery.ts
    └── useLocalStorage.ts
```

## File and function size constraints

**Files target 200 lines.** Functions target 50 lines. Both are soft — cohesion beats hitting the number. The constraint shapes the migration: new files should land under 200 lines from the start, existing files refactored when touched.

This rule is the reason the architecture leans on small composable pieces — one hook per domain action, one skeleton per card shape, one context per concern. Splitting is cheap; merging is harder.

**Practical implications for this migration:**
- A `*Client.tsx` orchestrator that grows past 200 lines should split into sub-sections (e.g. `DashboardLeftColumn.tsx`, `DashboardRightColumn.tsx`)
- A hook file with more than ~6 hooks should split by sub-domain (e.g. `hooks/employer/jobs.ts` + `hooks/employer/job-mutations.ts`)
- A skeleton primitive should be one component, one file — no kitchen-sink `skeletons.tsx`
- A query-keys factory is allowed to grow past 200 if it's just keys (typed const definitions, no logic) — judgment call

## Conventions

**File naming.** Page client components end with `Client.tsx`:
- `dashboard/page.tsx` (server stub)
- `dashboard/DashboardClient.tsx` (client orchestration)

Component files matching the page subject get the bare name:
- `WorkerKpiRow.tsx` (not `WorkerKpiRowClient.tsx`)
- They're all `"use client"` but the directive doesn't need to leak into the filename

**Barrel exports.** `lib/api/hooks/index.ts` re-exports everything for ergonomic imports. Components import from `@/lib/api/hooks`, not the file directly.

**Domain grouping in hooks.** Worker, admin, employer hooks each get their own subfolder once the count exceeds ~6 files in one domain. Below that, flat is fine.

**Skeletons live with the design system, not the component.** A skeleton is part of the loading UX vocabulary, not the component that ultimately replaces it. Putting them under `ui/skeleton/domain/` makes them discoverable.

**Page client components stay colocated with the route.** `DashboardClient.tsx` lives next to `dashboard/page.tsx`. Components used by the client (cards, widgets) live under `components/<domain>/` so they're reusable across pages.

## What's removed in cleanup PR

- `lib/api/profile.ts`, `lib/api/me.ts`, `lib/api/jobs.ts`, etc. — the server-side fetcher wrappers used by RSCs. Replaced by client hooks.
- `lib/auth/role.ts` — `requireRole()` callsites in app layouts. Kept for the auth-page exception list.
- Server actions for app-page mutations. Replaced by `useMutation` hooks.

## What's preserved

- `lib/api/server-client.ts` — `getServerApiClient()` still exists for the marketing/auth exception list
- `@agconn/api-client` package — same client, used in both server and browser
- `lib/i18n/` — next-intl wiring unchanged
- `middleware.ts` — proxy unchanged (handles unauth → /sign-in)
