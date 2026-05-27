# Web architecture — client-first for app shells

**Status:** Direction locked 2026-05-27. Implementation in progress.

**Scope:** All app shell routes under `apps/web/src/app/[locale]/`:
- `/worker/(shell)/**`
- `/employer/(shell)/**`
- `/admin/(shell)/**`
- `/field/(shell)/**`

**Out of scope:** Marketing pages, auth pages, sitemap/robots/manifest. See [Where SSR stays](#where-ssr-stays).

## The architectural problem

The web app has two backend-for-frontend layers doing the same job:

1. **`apps/api`** — Hono REST API at `/v1/*`. Designed BFF. Owns auth, RLS, data composition, business logic. Exists for this purpose.
2. **`apps/web` async server components** — Accidental BFF. Arrived by reaching for `await fetchX()` inside `async function Page()`. Calls `apps/api` and serializes the result into HTML.

A single dashboard render does **~17 web→api round trips across 4 sequential phases**, with **~15 Clerk token mints** (one per `getServerApiClient` call), producing **3-5 second SSR time for a single user with minimal data**. Hardware doesn't fix this; the layer is doing duplicate orchestration work and stacking serial round trips that the browser could fan out in parallel.

Reference: [`~/.agent/diagrams/agconn-bff-architecture.html`](~/.agent/diagrams/agconn-bff-architecture.html) — current vs proposed flow, topology, page-type matrix.

## The decision

For app shells, **drop Next.js SSR**. Move data fetching to the browser via TanStack Query v5 against the existing `/v1/*` API.

The browser is the only orchestrator. It mints one Clerk token per session (cached, reused), keeps one HTTP/2 connection alive (multiplexed, one TLS handshake), and fans out parallel fetches that auto-deduplicate by query key. The web pod becomes a static-asset server for these routes.

## Architecture in 9 layers

### 1. Providers (`apps/web/src/components/providers/AppProviders.tsx`)

Mounted once at `app/[locale]/layout.tsx`. Wraps everything client-side:

```tsx
<ClerkProvider>
  <QueryClientProvider client={queryClient}>
    <NextIntlClientProvider messages={messages}>
      <ActiveEmployerProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ActiveEmployerProvider>
    </NextIntlClientProvider>
  </QueryClientProvider>
</ClerkProvider>
```

`queryClient` defaults:
- `staleTime: 60_000` — 1 minute freshness window
- `refetchOnWindowFocus: false` — field workers on flaky connections
- `retry: 1`, exponential backoff
- `gcTime: 300_000` — keep cached data 5 minutes after unmount

### 2. Contexts (`apps/web/src/lib/context/`)

Cross-cutting client state. One context per concern.

| Context | Owns | Replaces |
|---|---|---|
| `ActiveEmployerContext` | Selected employer for multi-employer users; persisted to localStorage + cookie | Server-side cookie read in `getServerApiClient` |
| `ToastContext` | Toast queue + `useToast()` hook | Ad-hoc toast components |
| `RoleContext` | Cached `{ role, onboarded, tenantId }` derived from `useMe()` first call | `requireRole()` server gate |

Auth itself stays on `@clerk/nextjs`. Do not wrap `useAuth()`, `useUser()`, `useSession()`.

### 3. API client (`apps/web/src/lib/api/client.ts`)

One typed client instance used by every hook. Same `@agconn/api-client` package used today, but bridged to client-side:

```ts
export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  getSession: () => clerkTokenStore.get(),
  getLocale: () => currentLocale(),
  getHeaders: () => activeEmployerHeader(),
});
```

`clerkTokenStore` is a singleton populated by a small bridge component inside the provider tree. The bridge does `useAuth()` → `setTokenGetter(() => session.getToken())` once; subsequent calls hit the cached token.

**Errors throw.** Unlike the server-side wrapper that returns `{ ok: false }`, the client throws on `!ok`. TanStack Query's error path then works naturally.

**401 handling:** A response interceptor invalidates the auth state and redirects to `/sign-in`. Token refresh is handled by Clerk's SDK before requests fire.

### 4. Hooks (`apps/web/src/lib/api/hooks/`)

One file per domain. Each file exports query + mutation hooks. **Components never call `apiClient` directly** — they call a hook.

```ts
// hooks/profile.ts
export function useProfile() {
  return useQuery({
    queryKey: qk.profile(),
    queryFn: () => apiClient.get('/v1/profile').then(unwrap),
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (body) => apiClient.patch('/v1/profile', body).then(unwrap),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.profile() }),
  });
}
```

This is the seam between the API contract and the UI. Refactoring an endpoint = updating one hook, not 12 components.

### 5. Query key registry (`apps/web/src/lib/api/query-keys.ts`)

Typed factory:

```ts
export const qk = {
  profile: () => ['profile'] as const,
  myShifts: () => ['me', 'shifts'] as const,
  myPay: () => ['me', 'pay'] as const,
  recommendedJobs: (filters?: JobFilters) => ['jobs', 'recommended', filters] as const,
  applications: () => ['applications'] as const,
  messageThreads: () => ['messages', 'threads'] as const,
  // ...
};
```

Prevents string-typo cache misses. Enables surgical invalidation via the factory function rather than ad-hoc strings.

### 6. Skeleton primitives (`apps/web/src/components/ui/skeleton/`)

Tierra-styled loading placeholders. Per [docs/brand/](../../brand/), hairline-bordered with subtle pulse:

- `<Skeleton w h r>` — base block
- `<SkeletonCard>`, `<SkeletonRow>`, `<SkeletonChip>`, `<SkeletonText lines={3}>`
- `<SkeletonKpiRow>`, `<SkeletonShiftCard>` — domain-specific composites
- Animation respects `prefers-reduced-motion`

### 7. Page conventions

**Every app page follows this shape.**

`page.tsx` is a server component with no awaits, no data fetches — it exists only to satisfy the router contract:

```tsx
// page.tsx
import { DashboardClient } from './DashboardClient';

export default function Page() {
  return <DashboardClient />;
}
```

The `*Client.tsx` is the orchestration layer:

```tsx
// DashboardClient.tsx
"use client";
import { Suspense } from 'react';
import { WorkerGreeting } from '@/components/worker/WorkerGreeting';
import { WorkerKpiRow } from '@/components/worker/WorkerKpiRow';
// ...

export function DashboardClient() {
  return (
    <div className="px-5 pb-16 pt-8">
      <Suspense fallback={<SkeletonGreeting />}>
        <WorkerGreeting />
      </Suspense>
      <Suspense fallback={<SkeletonKpiRow />}>
        <WorkerKpiRow />
      </Suspense>
      {/* ... */}
    </div>
  );
}
```

Each section component is `"use client"` and uses its own query hooks with Suspense mode enabled:

```tsx
// WorkerKpiRow.tsx
"use client";
import { useMyPay, useApplications } from '@/lib/api/hooks';

export function WorkerKpiRow() {
  const { data: pay } = useMyPay({ suspense: true });
  const { data: apps } = useApplications({ suspense: true });
  // renders synchronously with data
}
```

**Section-level Suspense** is the convention — each card has its own boundary and skeleton. Cards fill in independently as data arrives. The slowest card never gates faster ones.

### 8. Layout shape

Server layout handles only the locale resolve + provider mount. No data fetches:

```tsx
// [locale]/worker/(shell)/layout.tsx
export default async function Layout({ children, params }) {
  const { locale } = await params;
  return <WorkerShellClient locale={locale}>{children}</WorkerShellClient>;
}
```

Client shell handles auth gate + chrome:

```tsx
// WorkerShellClient.tsx
"use client";
export function WorkerShellClient({ locale, children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { data: me, isPending } = useMe();

  if (!isLoaded || isPending) return <ShellSkeleton />;
  if (!isSignedIn) return null;  // proxy already redirected
  if (!me?.onboarded) {
    redirect(`/${locale}/worker/onboarding`);
  }

  return (
    <ShellGrid>
      <Sidebar />  {/* internally uses useNavCounts() with Suspense */}
      {children}
    </ShellGrid>
  );
}
```

**Nav counts no longer block children.** Sidebar renders its own skeleton; page renders its own skeleton; both fill in independently.

### 9. Auth gate (proxy + client guard)

Two layers of defense:

**Layer 9a — `apps/web/middleware.ts` (the proxy):**
- Redirects unauthenticated requests to `/sign-in` before they hit the app
- Cheap, runs at the edge, no app-pod CPU
- Existing logic preserved

**Layer 9b — `WorkerShellClient` (the client guard):**
- Reads `useMe()` to check `onboarded` flag
- Redirects un-onboarded to `/onboarding`
- Renders shell skeleton while `useMe()` is loading

No server-side `requireRole()` await. The role check happens via a query that hits `/v1/me` once per session; the result populates `RoleContext` for downstream consumers.

## Where SSR stays

Documented exception list. Anything not on it should be client-first.

| Path | Pattern | Why |
|---|---|---|
| `app/[locale]/(marketing)/**` | SSG / ISR | SEO; anonymous traffic |
| `app/[locale]/(auth)/**` | SSR | Clerk flow expects server context |
| `app/[locale]/(auth)/post-auth/**` | SSR | UA-sniff + redirect happens server-side |
| `app/sitemap.ts`, `robots.ts` | Server | Required by Next.js convention |
| Webhook handlers | Route handlers | Server-only by definition |

ESLint rule (added in cleanup PR): forbid `await getServerApiClient` outside this allowlist.

## Migration sequence

| # | PR | What | Risk |
|---|---|---|---|
| 1 | Foundation | Providers, contexts, client bridge, hooks/, query-keys, skeleton primitives. No page changes. Tests prove wiring. | Low |
| 2 | Worker shell sweep | Convert `(shell)/**` for `/worker` and `/field` | Medium |
| 3 | Employer shell sweep | Convert `(shell)/**` for `/employer` | Medium |
| 4 | Admin shell sweep | Convert `(shell)/**` for `/admin` | Low |
| 5 | Cleanup | Remove unused server fetchers + server actions; add ESLint guard; remove `requireRole()` callsites | Low |

PRs are sequential but each is independently shippable. Foundation can ship and sit unused; sweeps can land one shell at a time.

## Wins (measured target)

- **Time to skeleton: <500ms** (down from 3-5s SSR blocking blank screen)
- **Round trips per page: ~9 parallel** (down from ~17 sequential across 4 phases)
- **Clerk token mints per page: 0** (down from ~15; one mint per session, cached)
- **TLS handshakes per page: 0** (down from ~17; HTTP/2 multiplex reuses connection)
- **Web pod CPU per request: ~0** (down from full SSR render cost)

## Costs (honest)

- Brief skeleton flash on first nav (~100-300ms) where today HTML arrives pre-filled
- Refactor surface area: every page + component under the 4 shells
- Client-side auth ergonomics: 401 handling, token refresh, route guards need centralization via the API client + bridge
- Larger initial JS bundle (TanStack Query + hooks)

## Related

- [Onboarding identity gaps](../../10-worker/) — auth flow is one of the few server-side pages that stays
- [Field mode](../../10-worker/99-field-mode.md) — `/field` shell follows the same client-first pattern, mobile-first
- [Multi-tenancy](../01-multi-tenancy/) — `ActiveEmployerContext` replaces the server-side cookie lookup
