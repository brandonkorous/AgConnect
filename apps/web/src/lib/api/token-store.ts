'use client';

// Token store populated by ClerkTokenBridge once Clerk loads.
//
// Why a store: the api client needs a session token on every request, but
// reading it via `window.Clerk.session.getToken()` is async and uncached at
// the call site. The bridge calls Clerk's `useAuth()` once, gets a stable
// `getToken` reference, and stores it here. Subsequent api calls hit a sync
// closure that Clerk has already cached internally — no per-call await of
// the global handshake.
//
// Fallback path remains in client.ts for any code path that runs before the
// bridge mounts (rare; mostly SSR/RSC).

type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter | null = null;

export const tokenStore = {
  set(g: TokenGetter | null): void {
    getter = g;
  },
  get(): TokenGetter | null {
    return getter;
  },
};
