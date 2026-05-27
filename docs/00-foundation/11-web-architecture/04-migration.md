# Migration plan

Five-PR sequence. Each is independently shippable.

## PR 1 — Foundation (no UI changes)

**Scope:** Add the new infrastructure without touching any pages. Verify wiring with a test page that's not yet linked from anywhere.

**Adds:**
- `apps/web/src/components/providers/AppProviders.tsx`
- `apps/web/src/components/providers/QueryClientBridge.tsx`
- `apps/web/src/components/providers/ClerkTokenBridge.tsx`
- `apps/web/src/components/providers/ActiveEmployerProvider.tsx`
- `apps/web/src/lib/api/client.ts` (browser instance)
- `apps/web/src/lib/api/token-store.ts`
- `apps/web/src/lib/api/unwrap.ts`
- `apps/web/src/lib/api/query-keys.ts`
- `apps/web/src/lib/api/hooks/` (skeleton; one or two domain files to validate pattern)
- `apps/web/src/lib/context/ActiveEmployerContext.tsx`
- `apps/web/src/lib/context/RoleContext.tsx`
- `apps/web/src/lib/context/ToastContext.tsx`
- `apps/web/src/components/ui/skeleton/*` (base primitives)
- `apps/web/src/app/[locale]/layout.tsx` (mount `<AppProviders>`)
- `package.json`: `@tanstack/react-query`, `@tanstack/react-query-devtools`

**Verification:**
- Build passes, typecheck passes
- An internal `/_dev/foundation-test` page (only enabled in dev) consumes `useProfile()` and renders profile data — proves the full chain works end-to-end
- Existing pages continue to work unchanged (SSR path still functional)

**Risk:** Low. Pure addition.

## PR 2 — Worker shell sweep

**Scope:** Convert every page + component under `apps/web/src/app/[locale]/worker/(shell)/**` and `apps/web/src/app/[locale]/field/(shell)/**`.

**Pattern, per route:**
1. Identify the existing `async function Page` with its awaits
2. Split into `page.tsx` (server stub) + `*Client.tsx` (orchestration)
3. Add Suspense boundaries around each section
4. Convert child components to `"use client"` + query hooks
5. Build domain skeleton primitives as needed under `components/ui/skeleton/domain/`

**Specific routes:**
- `dashboard/`
- `jobs/` (list + detail + saved)
- `applications/`
- `messages/` (list + thread)
- `pay/`
- `shifts/`
- `documents/`
- `profile/`
- `training/`
- `wallet/`
- `me/`
- `saved-searches/`
- `[...notFound]/`

**Layout conversion:**
- `worker/(shell)/layout.tsx` becomes a thin server wrapper
- New `WorkerShellClient.tsx` for chrome + auth gate
- `fetchWorkerNavCounts` becomes `useNavCounts` (hook in `lib/api/hooks/me.ts`)
- Sidebar consumes `useNavCounts` with its own Suspense boundary
- `/field` shell follows same pattern, mobile-first

**Offline support for `/field` (in this PR, not deferred):**
- Add `@tanstack/react-query-persist-client` + `createSyncStoragePersister` to deps
- Mount persistor only in `/field` shell (worker + employer shells do NOT get it yet)
- Persistor uses IndexedDB; key namespace = `agconn-field-cache-v1`
- Cache `staleTime`/`gcTime` tuned for field use: longer windows, opt-in refetch on reconnect
- Mutations made while offline queue via TanStack Query's built-in retry; surface offline state via a banner component in the shell

**Verification:**
- Click through every route signed-in as a worker
- Confirm time-to-skeleton <500ms on each
- Confirm cards fill in progressively (no synchronized reveal)
- Confirm no console errors, no double-fetches in devtools, no 401 loops

**Risk:** Medium. Biggest single PR. Stage commits per route so review is incremental.

## PR 3 — Employer shell sweep

Same shape as PR 2 for `apps/web/src/app/[locale]/employer/(shell)/**`.

Special considerations:
- `ActiveEmployerProvider` now actively consumed (multi-employer users)
- Some pages (workers list, job posts) have heavier data — confirm pagination/filter hooks work
- Employer-side mutations (post job, edit shift) become `useMutation` hooks

**Risk:** Medium.

## PR 4 — Admin shell sweep

Smaller surface. Apply same pattern to `apps/web/src/app/[locale]/admin/(shell)/**`.

**Risk:** Low.

## PR 5 — Cleanup

**Removes:**
- Server-side fetcher wrappers in `apps/web/src/lib/api/` (the ones replaced by hooks): `profile.ts`, `me.ts`, `jobs.ts`, etc.
- Server actions for app-page mutations
- `requireRole()` callsites in app shell layouts (kept for marketing/auth)
- Unused imports of `getServerApiClient` in app shell tree

**Adds:**
- ESLint rule: forbid `import { getServerApiClient }` outside an allowlist (auth pages, marketing pages, sitemap/robots/manifest)
- ESLint rule: forbid `async function Page` inside `*/(shell)/**` paths

**Verification:**
- ESLint passes
- `pnpm typecheck` passes
- Production smoke test on staging

**Risk:** Low.

## Order rationale

- Foundation first (independent, ships even if downstream slips)
- Worker before employer (worker shell is the most complex; pattern hardens here)
- Field shares worker's PR — same audience, mobile-first variant of same pattern
- Admin last (smallest, lowest risk, validates pattern on a clean slate)
- Cleanup at the end so we're not deleting things we then have to re-add

## Per-PR commit cadence

Within each sweep PR, commit per route so review can be incremental:

```
chore(web): add worker dashboard skeleton primitives
refactor(web): convert worker/dashboard to client-first
refactor(web): convert worker/jobs to client-first
refactor(web): convert worker/applications to client-first
...
refactor(web): convert worker/(shell)/layout to client shell
```

Each commit should leave the app in a working state. CI runs on every push.

## What to do if a sweep PR gets too big

Split by route group. The worker shell sweep can become two PRs:
- PR 2a: dashboard, jobs, applications, messages (most-used)
- PR 2b: pay, shifts, documents, profile, training, wallet, me, saved-searches (everything else)

Same for employer if needed.

## Rollback story

Each sweep PR is page-by-page, so reverting one route doesn't require reverting all of them. If a specific page misbehaves after the sweep, revert the specific commit, ship the rest. The Foundation PR is purely additive — nothing depends on it being live, it just enables the pattern.
