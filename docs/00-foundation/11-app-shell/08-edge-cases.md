# 11 — App Shell: Edge Cases & Risks

## Toast spam after a flaky network

A worker tapping "submit" repeatedly on a flaky connection can trigger N offline toasts.

**Mitigation:**

- API client de-dupes `code: 'offline'` toasts with `dedupeKey: 'offline'` automatically.
- The "you're offline" sticky toast and the `<OfflineBanner>` share the same dedupe — never two simultaneous "offline" notifications.
- Form `<FormSubmit>` is disabled during `isSubmitting`, so even a frenetic user can't fire two requests in flight.

## Toast emitted from server component

Server components do not call `apiClient` (per [03-api.md](03-api.md)). They cannot emit toasts directly. To surface an error from a server component:

1. Throw a typed error in a server action; the form `<FormSubmit>` catches it via the React `useFormState` boundary and routes through `useToast()`.
2. Or render an inline `<Alert>` (a non-toast brand component) on the page — appropriate for full-page errors.

Anti-pattern: side-channeling a toast via cookies or query params.

## Modal stacking

Two `confirm()` calls in a row produce two stacked modals — confusing and a focus-trap nightmare.

**Mitigation:** the modal provider serializes calls. The second `confirm()` awaits the first to resolve before mounting. A console warning fires in dev if a third call queues; production silently serializes.

> **Inferred:** Serialization rather than rejection. Some flows legitimately want a second confirm after the first ("Delete the job?" → "Also archive 12 applications?"); rejecting would force the caller to invent state. Serialization preserves caller ergonomics at the cost of a possible long wait — which is fine because the user is the one driving each decision.

## Error envelope drift

A new endpoint returns a bare body (`return c.json(profile)`) instead of `return ok(c, profile)`. The client unwraps `res.data` and gets `undefined`.

**Mitigation:**

- `ok()` / `err()` helpers are mandatory; an ESLint rule blocks `c.json` outside the helper file.
- An integration test enumerates every registered route, fires a baseline request, and asserts the response body has either `ok: true` with `data` or `ok: false` with `error.code`.
- The Hono `onError` handler ensures even a thrown bare object becomes envelope-shaped.

## Service worker breaks deploys

A bad SW deploy can serve stale or broken HTML to every returning user.

**Mitigation:**

- Service worker uses a versioned cache name (`agconn-v${BUILD_HASH}`); old caches are deleted on activate.
- The skip-waiting / claim-clients flow only runs on user-initiated refresh (the "update ready" toast), never automatically. So a bad SW reaches at most users who tap the refresh toast — and the toast is only shown after the new SW reaches `installed` state successfully.
- A `?clear-sw` query param triggers a hard unregister + reload, available as a debug escape hatch.
- Sentry tagged with `sw.version` so a bad-version regression is identifiable.

> **Inferred:** No automatic activation on deploy. Forcing skip-waiting on every deploy can create a broken experience mid-form for active users. The "soft activate" model trades freshness for safety; users see a small toast and choose when to refresh.

## Service worker scope leaks into admin

The SW scope is `/`, but `/admin/*` routes must never be cached.

**Mitigation:**

- The runtime caching rules in `next-pwa.config.ts` explicitly exclude `/admin/*` and `/admin/v1/*` paths.
- A unit test against the generated `sw.js` asserts no `/admin` route appears in the precache manifest.
- Admin pages set `<meta name="robots" content="noindex">` and `cache-control: no-store, private` headers.

## Install prompt dismissed forever

Once a worker dismisses the install card, they may regret it later but never see it again because we set `pwa.install.dismissed = true` in localStorage with no expiry.

**Mitigation:**

- Add a manual "Install AgConn" link in the worker dashboard footer. Clicking it clears the localStorage flag and re-shows the prompt on the next eligible event.
- `iOS install hint` has its own flag (`pwa.install.ios.dismissed`) — same pattern.

## iOS adds quirks

iOS Safari does not fire `beforeinstallprompt`. iOS PWA support also has long-standing quirks: localStorage is wiped after 7 days of inactivity, push notifications require iOS 16.4+, the manifest theme color does not always apply.

**Documented behavior, not a bug:**

- The `<IosInstallHint>` covers the install path.
- We do not rely on localStorage for security-critical state (sessions are in cookies).
- Push notifications are out of scope for MVP regardless.

## API client outside a provider

A hook in a unit test or a Storybook story calls `useApi()` without `<ApiProvider>` mounted → the hook throws.

**Mitigation:** documented in the package README. Tests import a `MockApiProvider` from `@agconn/api-client/testing` that takes a `Record<string, ApiResponse<unknown>>` map and returns canned responses.

## Locale switch mid-request

User changes the locale toggle while a request is in flight. The request was sent with `accept-language: en`; the response message is in English; the UI is now Spanish.

**Mitigation:** acceptable. The next request gets ES and the toast is short-lived. We do not retry pending requests on locale change. (If this proves jarring in user testing, add a 100ms debounce on locale change that aborts in-flight requests.)

## Errors that should NOT auto-toast

Certain endpoints should never auto-toast even on error — for example, a polling status endpoint that returns 404 while a record is being created.

**Mitigation:** call sites pass `handleErrorInline: true`. Documented examples in `03-api.md`.

## Form auto-save & queue

A worker editing a long form on an unstable connection may want changes saved automatically without losing data on a 30-second LTE blip.

**MVP behavior:** no auto-save, no queue. Forms are submit-on-button. The `<OfflineBanner>` warns the worker.

**Tier 2 plan:** opt-in `autosave` mode on `<Form>` that:
- saves on blur to `localStorage` keyed by route + form id,
- restores on remount,
- attempts background submit when navigator goes online.

Tracked here so feature authors don't independently invent worse versions.

## Validation message mismatch

A zod issue's `code` (e.g., `invalid_email`) does not match a `shell.validation.<code>` key.

**Mitigation:** the `validate()` middleware falls back to `shell.validation.custom` and logs a Sentry warning so we add the missing key.

## Reduced motion

Some users disable animations system-wide. The toast slide-in is just visual sugar.

**Mitigation:** all motion in `packages/ui` is inside `@media (prefers-reduced-motion: no-preference)` blocks. Reduced-motion users see opacity-only transitions.

## Print & email rendering

`packages/ui` primitives are not designed for print or email rendering. React Email templates live in `packages/email-templates` (see [06-email-pipeline](../06-email-pipeline/)) and use a separate token set.

## Compliance: install-prompt analytics

Tracking `beforeinstallprompt` shown / accepted / dismissed without user consent is borderline under CCPA depending on the jurisdiction's interpretation.

**Mitigation:**

- Only emit analytics events for these signals after a user has consented to non-essential analytics via the cookie banner (planned, separate spec).
- The events themselves carry no PII — only `event: 'pwa.install.shown'`, `event: 'pwa.install.accepted'`, etc.

## Open questions

1. **Cookie consent banner** — not yet specced. Without it, even essential analytics may need a justification path. Recommend speccing alongside `09-seo-aio` in Phase 5.
2. **`@hookform/resolvers/zod` version** — needs to match the zod version pinned in `packages/schemas`. Lock the matrix in `package.json` resolutions.
3. **`packages/ui` storybook?** — a Storybook setup would help reviewers see all primitives in both Tierra themes and both locales without running the whole app. Out of scope for MVP, recommended for Phase 2.
