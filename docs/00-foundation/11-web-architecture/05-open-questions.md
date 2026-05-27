# Decisions

All 10 questions resolved 2026-05-27. Listed in original priority order.

## 1. QueryClient lifecycle [DECIDED]

**Resolution:** Purely client-side. `QueryClient` created in `QueryClientBridge.tsx` with `'use client'`. No server prefetching, no `HydrationBoundary` for app shells.

**Why:** Aligns with the architecture's core goal — drop SSR data fetching for app pages. Brief skeleton flash on first paint is the accepted tradeoff.

## 2. Clerk token bridge [DECIDED]

**Resolution:** Imperative token store + `ClerkTokenBridge` component.

`apps/web/src/lib/api/token-store.ts` is a module-level singleton with `set(getter)` / `get()`. `ClerkTokenBridge.tsx` mounts inside `ClerkProvider`, calls `useAuth()`, and populates the store with a current getter via `useEffect`. `apiClient` reads from the store synchronously.

**Why:** Allows imperative `apiClient.get()` calls outside React render (background sync, service worker dispatch, future PWA offline queue) while still letting hooks be the conventional path.

## 3. Toast component [DECIDED]

**Resolution:** Use daisyUI's `alert` component as the visual primitive. Wrap in a custom `ToastProvider` that owns the queue, portal mount, lifecycle (auto-dismiss, dedupe). Restyle the daisyUI alert for Tierra tokens.

**Why:** Building from scratch causes design variation across pages and feature sets. Wrapping daisyUI primitives keeps the visual system consistent. Only build from scratch when daisyUI has no equivalent.

## 4. Section skeletons [DECIDED]

**Resolution:** All per-card. Every card on every primary surface gets a hand-shaped skeleton matching the real card's structure (avatar shape, line counts, badge positions). Estimated ~15 skeleton components across the four shells.

**Why:** Maximum visual continuity at first paint → content transition. Aligns with Tierra brand quality bar. The migration is the right time to invest in this — building it after the fact is worse.

## 5. RoleContext shape [DECIDED]

**Resolution:** Thin wrapper around `useMe()`. `RoleContext.useRole()` is essentially `useMe().data` derived. No duplicate state.

**Why:** Cache stays the source of truth. Avoids drift between context and query.

## 6. 401 handling [DECIDED]

**Resolution:** Global interceptor in `apiClient`. Any 401 invalidates the auth state and redirects to `/sign-in`. Token refresh handled by Clerk's SDK before requests fire.

**Why:** 401 always means the same thing. Consistent behavior across the app. One place to update if the auth flow changes.

## 7. Optimistic updates [DECIDED]

**Resolution:** Opt-in per mutation. Default mutations wait for server response. Reserve optimism for high-frequency interactions (toggles, mark-read, like buttons).

**Why:** Most CRUD doesn't need it. Optimism adds rollback complexity that's not worth it for a sub-300ms wait.

## 8. i18n translations [DECIDED]

**Resolution:** Status quo. Root layout (which stays server) fetches translations via `getTranslations()`, passes via `NextIntlClientProvider` messages prop. Documented exception inside the "no app-shell server fetches" rule.

**Why:** Translations are static enough — once per locale, not per shell page. Server fetch in the root layout is fine; it's not a per-shell-page hop.

## 9. PWA / offline behavior [DECIDED]

**Resolution:** Design offline support now for `/field` specifically. Wire `@tanstack/react-query-persist-client` + `createSyncStoragePersister` (IndexedDB-backed) into the `/field` shell during the worker sweep PR. Other shells (worker, employer, admin) don't get offline support yet.

**Why:** `/field` workers are the most likely to be on spotty connections (literally in the field). Offline reads from cached query data + queue mutations for when connection returns. Other shells (desktop, indoor) can opt in later if needed.

## 10. Devtools in production [DECIDED]

**Resolution:** Dev-only. Mount conditionally via `process.env.NODE_ENV === 'development'`. Off in prod.

**Why:** Too noisy and could leak internals.
