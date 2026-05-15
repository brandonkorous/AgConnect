# 11 — App Shell: Overview

## Purpose

The app shell is the cross-cutting **client layer** that every feature page in AGCONN renders inside. It owns:

1. The UX primitives every feature consumes (toast, modal/dialog, form, skeleton, empty state, error boundary, API client).
2. The PWA wrapper that ships those primitives to a phone in the field — manifest, service worker, install prompt, offline fallback.
3. The contract that ties (1) and (2) together — which routes are app-shell vs. network-first, which mutations are write-through vs. queueable, how errors flow from API to UI.

The name "app shell" is intentional — it follows the [Google PWA app-shell pattern](https://web.dev/app-shell/). The static scaffold (nav, footer, primitives) is precached by the service worker; per-route content streams over the network.

## Why this is a foundation

Without an app shell defined up-front, every feature reinvents:

- toast plumbing (variants, queue, a11y, locale),
- form validation glue (RHF + zod + error rendering + i18n error messages),
- API error handling (each endpoint invents its own error shape; UI inconsistently shows them),
- loading/empty/error states (some pages have skeletons, others have spinners, others just go blank).

By the time three features ship without it, the cleanup project becomes a multi-week migration touching every page. By contrast, the marginal cost of locking the contract now is one `packages/ui` package + one `packages/api-client` package + a manifest and a service worker config.

## Scope

In scope:

- **Primitives** in `packages/ui`: `<Toast>`, `useToast()`, `<Modal>` + `confirm()`/`alert()`, `<Form>` / `<Field>` / `<FieldError>` / `<FormSubmit>`, `<Skeleton>`, `<EmptyState>`, `<ErrorBoundary>`, `<PageError>` (404/500).
- **API client** in `packages/api-client`: typed fetch wrapper, error envelope discriminated union, automatic toast emission for unhandled errors, abort signal hooks for React Query / SWR.
- **PWA wrapper** in `apps/web`: `manifest.webmanifest`, app icons, theme color (Tierra), service worker registration, app-shell precache, offline fallback page (bilingual), install prompt UX.
- **Mutation policy** — a written rule per route or per resource: write-through (must be online), queueable (offline-tolerant, replays on reconnect), or read-only (cached). MVP can default everything to write-through; the policy lives here so future offline work is incremental.
- **Error → toast flow** — server errors flagged `toast: true` in the envelope auto-render via the API client; per-call overrides for inline error rendering instead.

Out of scope (deferred):

- Push notifications (web push / FCM) — Tier 2.
- Background sync API for offline mutations — Tier 2 (the policy is captured, the queue isn't built).
- IndexedDB-backed offline data store (worker app reading saved jobs offline) — Tier 2.
- Native iOS/Android wrappers — post-MVP.
- A11y audit automation (axe-core in CI) — Tier 2 (manual checks in MVP per [docs/brand/12-accessibility.md](../../brand/12-accessibility.md)).

**Decision (confirmed 2026-04-30):** mutations are **write-through** for MVP. Workers on patchy LTE see a "no connection" toast on submit and retry. Queue-and-replay (idempotency keys, conflict resolution, pending-state UI, retry/backoff, session-change reconciliation) is a deliberate post-launch upgrade path — too large to build correctly inside the 5-day window before launch. Revisit after Phase 1 worker rollout if the data shows real friction.

## Roles & access

The app shell is **role-agnostic** — every authenticated and unauthenticated surface uses it. Specific surfaces:

- **Worker PWA** — the most demanding consumer. Must install, must show an offline page, must render large tap targets and large text.
- **Employer dashboard** — uses the same primitives but does not require the install prompt (desktop-first usage).
- **Admin dashboard** — same primitives, no PWA features (the manifest scope excludes `/admin`).
- **Marketing / public landing** — uses primitives (toast for waitlist confirmation) but is not a PWA target. Service worker scope is set to exclude landing routes so they remain perfectly indexable.

## Key invariants

1. **Every UI string in a primitive is bilingual.** Toast variants, modal buttons, form errors, empty-state CTAs all read from `packages/i18n` (`shell.*` namespace). No hard-coded English strings in `packages/ui`.
2. **Every API response uses the error envelope.** Hono handlers emit `{ ok: true, data }` or `{ ok: false, error: { code, message, fields?, toast? } }`. Never a bare 4xx body. The `code` field uses snake_case and is stable; `message` is human-readable and may be localized server-side.
3. **The API client never throws on 4xx.** It returns the discriminated union. Throwing is reserved for transport failures (network, abort, parse). This forces UI code to handle the error explicitly instead of relying on a global try/catch.
4. **Toasts are bounded.** Maximum 3 visible at once; older toasts collapse. Errors auto-dismiss at 8 s, info/success at 5 s, sticky variants only for "you are offline" / "version updated, refresh".
5. **Service worker scope excludes admin.** `/admin/*` and `/admin/v1/*` are never precached and never served from the SW cache. Admin actions must always hit live data.
6. **The shell never reads `tenant_id`.** Tenant resolution stays server-side per [01-multi-tenancy](../01-multi-tenancy/). The API client adds no tenant header — the cookie/JWT carries it.
7. **Audit emission is opt-in at the call site.** The API client exposes `track: false | { action, resource }` for the rare client-initiated audit event (e.g. "admin.impersonation.started"); most audits emit server-side per [12-audit-log](../12-audit-log/).
8. **Updates are silent until safe.** New service worker versions activate on next idle navigation, never mid-form. A small "new version available" toast offers a manual refresh.

## Success criteria

- A new feature page can render its full happy + loading + empty + error states using only `packages/ui` primitives, with zero copy hard-coded in component files.
- A 4xx response from any Hono endpoint surfaces in the UI as a localized toast or inline field error within 50 lines of feature-side code (excluding the form definition).
- The worker PWA passes Lighthouse PWA category (installable, offline fallback, manifest valid, theme color set) on Pixel-class hardware over throttled 3G.
- A worker who loses connectivity mid-session sees the offline page on next navigation and recovers without a hard refresh once back online.
- A new engineer can implement a form with validation, server-side error display, and submit-success toast in under 30 minutes by reading [04-ui.md](04-ui.md).

## Dependencies

- [02-auth](../02-auth/) — session + role for the API client headers
- [04-i18n](../04-i18n/) — translation keys for all primitive copy
- [12-audit-log](../12-audit-log/) — error events with `code: 'internal_error'` are auto-audited server-side
- [docs/brand/](../../brand/) — primitive visual style (Tierra palette, type scale, spacing, motion)

## Non-dependencies

- The app shell does **not** depend on Clerk specifically. The API client takes an opaque session getter and is testable with a fake session.
- The app shell does **not** depend on Postgres or Prisma. Primitives live in `packages/ui`; the client lives in `packages/api-client`. Both are pure TS with no DB import.
