# Patterns

Canonical patterns for client-first app pages. When in doubt, match these shapes.

## Pattern 1: A simple data-fetching section

A card that fetches one thing and renders it.

```tsx
// components/worker/UpNextShift.tsx
"use client";

import { useMyShifts } from '@/lib/api/hooks';
import { SkeletonShiftCard } from '@/components/ui/skeleton/domain/SkeletonShiftCard';
import { useTranslations } from 'next-intl';

export function UpNextShift() {
  const { data: shifts } = useMyShifts({ suspense: true });
  const t = useTranslations('worker.dashboard.up_next');

  const next = shifts.find(s => new Date(s.shift.startTime) >= new Date());
  if (!next) {
    return <EmptyState message={t('none')} />;
  }
  return <ShiftCard shift={next} variant="dark" />;
}
```

Used in the page tree as:

```tsx
<Suspense fallback={<SkeletonShiftCard />}>
  <UpNextShift />
</Suspense>
```

**Notes:**
- `{ suspense: true }` makes the hook throw a Promise while loading, which Suspense catches
- The component renders synchronously with data — no `if (isLoading)` branches
- Translations are read client-side via `useTranslations` (not `getTranslations`)

## Pattern 2: A section with multiple queries

When a card needs data from two endpoints.

```tsx
// components/worker/WorkerKpiRow.tsx
"use client";

import { useMyPay, useApplications } from '@/lib/api/hooks';

export function WorkerKpiRow() {
  const { data: pay } = useMyPay({ suspense: true });
  const { data: apps } = useApplications({ suspense: true });

  const pending = apps.filter(a => a.status === 'applied').length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <KpiCard label="Earned" value={fmtMoney(pay.weekToDate)} />
      <KpiCard label="Pending apps" value={pending} />
      <KpiCard label="This week" value={pay.hoursWeekToDate} />
    </div>
  );
}
```

Both queries fire in parallel (TanStack Query handles it). Suspense waits for both before rendering. The cached query results are shared with any sibling that uses `useMyPay` or `useApplications` — auto-dedupe.

## Pattern 3: A mutation form

Form submits trigger an API call, cache invalidates, optimistic UI optional.

```tsx
// components/worker/AvailabilityForm.tsx
"use client";

import { useUpdateAvailability } from '@/lib/api/hooks';
import { useToast } from '@/lib/context/ToastContext';

export function AvailabilityForm({ initial }: { initial: Availability }) {
  const update = useUpdateAvailability();
  const toast = useToast();
  const [value, setValue] = useState(initial);

  async function handleSubmit() {
    try {
      await update.mutateAsync(value);
      toast.success('Saved');
    } catch (e) {
      toast.error('Could not save');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <AvailabilityGrid value={value} onChange={setValue} />
      <button disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
```

The mutation hook handles invalidation:

```ts
// lib/api/hooks/availability.ts
export function useUpdateAvailability() {
  return useMutation({
    mutationFn: (body) => apiClient.patch('/v1/profile/availability', body).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile() });
      queryClient.invalidateQueries({ queryKey: qk.myShifts() });
    },
  });
}
```

## Pattern 4: A page with parameterized data

The page reads a route param and the section fetches based on it.

```tsx
// app/[locale]/worker/(shell)/jobs/[jobId]/page.tsx
import { JobDetailClient } from './JobDetailClient';

type Props = { params: Promise<{ jobId: string }> };

export default async function Page({ params }: Props) {
  const { jobId } = await params;
  return <JobDetailClient jobId={jobId} />;
}
```

```tsx
// JobDetailClient.tsx
"use client";

import { useJob } from '@/lib/api/hooks/jobs';

export function JobDetailClient({ jobId }: { jobId: string }) {
  const { data: job } = useJob(jobId, { suspense: true });
  // ...
}
```

The hook:

```ts
export function useJob(jobId: string) {
  return useQuery({
    queryKey: qk.job(jobId),
    queryFn: () => apiClient.get(`/v1/jobs/${jobId}`).then(unwrap),
  });
}
```

## Pattern 5: A list with infinite scroll

Use TanStack Query's `useInfiniteQuery`.

```ts
// lib/api/hooks/jobs.ts
export function useJobsInfinite(filters: JobFilters) {
  return useInfiniteQuery({
    queryKey: qk.jobsList(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get('/v1/jobs', { params: { ...filters, cursor: pageParam } }).then(unwrap),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
```

```tsx
"use client";
export function JobsList({ filters }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useJobsInfinite(filters, { suspense: true });

  return (
    <>
      {data.pages.flatMap(p => p.jobs).map(j => <JobCard key={j.id} job={j} />)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          Load more
        </button>
      )}
    </>
  );
}
```

## Pattern 6: A search input with debounce

```tsx
"use client";
import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useJobsInfinite } from '@/lib/api/hooks/jobs';

export function JobsSearchClient() {
  const [input, setInput] = useState('');
  const query = useDebounce(input, 250);

  const { data } = useJobsInfinite({ q: query }, { suspense: true });

  return (
    <>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <JobsList data={data} />
    </>
  );
}
```

The query key includes `q`, so each debounced value becomes a fresh cache key — TanStack Query handles invalidation between keystrokes automatically.

## Pattern 7: Optimistic update

For mutations where instant feedback matters (toggle, like, mark-read).

```ts
export function useMarkThreadRead() {
  return useMutation({
    mutationFn: (threadId: string) =>
      apiClient.post(`/v1/messages/threads/${threadId}/read`).then(unwrap),
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: qk.messageThreads() });
      const prev = queryClient.getQueryData(qk.messageThreads());
      queryClient.setQueryData(qk.messageThreads(), (old: ThreadList) => ({
        ...old,
        threads: old.threads.map(t =>
          t.id === threadId ? { ...t, unread: false } : t
        ),
        totalUnread: old.totalUnread - 1,
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.messageThreads(), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.messageThreads() });
    },
  });
}
```

UI doesn't need any special handling — the cache update is reflected in every consumer immediately.

## Anti-patterns

**Don't await in `page.tsx` (app shells).** Use a `*Client.tsx` orchestrator instead.

```tsx
// ❌ Don't
export default async function Page() {
  const data = await fetchSomething();
  return <Card data={data} />;
}

// ✅ Do
export default function Page() {
  return <PageClient />;
}
```

**Don't call `apiClient` in components.** Always go through a hook.

```tsx
// ❌ Don't
export function Card() {
  const { data } = useQuery({ queryFn: () => apiClient.get('/v1/foo') });
}

// ✅ Do
export function Card() {
  const { data } = useFoo();
}
```

**Don't use page-level Suspense for app shells.** Section-level Suspense is the convention.

```tsx
// ❌ Don't
<Suspense fallback={<SkeletonPage />}>
  <DashboardClient />  {/* one big skeleton, slowest section gates page */}
</Suspense>

// ✅ Do
<>
  <Suspense fallback={<SkeletonGreeting />}><WorkerGreeting /></Suspense>
  <Suspense fallback={<SkeletonKpiRow />}><WorkerKpiRow /></Suspense>
  <Suspense fallback={<SkeletonShiftCard />}><UpNextShift /></Suspense>
  {/* each card fills in independently */}
</>
```

**Don't use raw fetch.** It bypasses the token bridge.

```tsx
// ❌ Don't
const res = await fetch('/v1/profile');

// ✅ Do — via a hook
const { data } = useProfile();

// ✅ Do — if you need imperative access (rare)
const data = await apiClient.get('/v1/profile').then(unwrap);
```

**Don't duplicate query logic.** If two components need the same data, both call the same hook. TanStack Query dedupes.

**Don't store server data in component state.** Let TanStack Query own it. Component state is for UI only (form input values, selected tabs, etc.).
