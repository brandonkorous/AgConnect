# 11 — App Shell: Acceptance Criteria

## Functional — primitives

- [ ] `useToast()` shows toasts of all four variants (success, error, warning, info) with correct ARIA roles (`status` for non-error, `alert` for error).
- [ ] Toast queue caps at 3 visible; older toasts collapse into a "+N more" pill that expands on hover/tap.
- [ ] `dedupeKey` collapses repeated calls within the dedupe window into a single visible toast with a reset timer.
- [ ] Hover and keyboard focus pause toast auto-dismiss; both work with `prefers-reduced-motion: reduce`.
- [ ] Toast tap target ≥ 44×44 px on touch devices.
- [ ] `confirm()` returns `Promise<boolean>` and resolves true on confirm, false on cancel/ESC/backdrop.
- [ ] `confirm({ variant: 'destructive' })` requires explicit click — ESC and backdrop do not resolve.
- [ ] `<Modal>` traps focus on open and returns focus to the trigger on close.
- [ ] `<Form>` submits a request, shows the spinner during `formState.isSubmitting`, and prevents double-submit by disabling the button.
- [ ] Server-side `fields` errors render via `ctx.setErrors()` and clear when the user edits the field.
- [ ] `<Skeleton>`, `<EmptyState>`, `<ErrorBoundary>`, `<PageError>` render with brand styling and bilingual copy.

## Functional — error envelope

- [ ] Every Hono endpoint emits the envelope shape: `{ ok: true, data }` or `{ ok: false, error: { code, message, ... } }`.
- [ ] No endpoint can return a bare body — verified by an integration test that walks the OpenAPI surface and asserts response shape.
- [ ] An unhandled throw in any handler is caught by `onError` and emitted as `{ ok: false, error: { code: 'internal_error', details: { correlationId } } }` with status 500.
- [ ] A failed zod parse emits `validation_failed` (422) with a `fields` map keyed by dotted path.
- [ ] Localized error messages respect `accept-language` from the request.

## Functional — API client

- [ ] `apiClient.get/post/patch/put/del` return `Promise<ApiResponse<T>>` and never throw on 4xx/5xx.
- [ ] Network failure (offline, DNS, TLS) returns `{ ok: false, error: { code: 'offline' } }`.
- [ ] Aborted request returns `{ ok: false, error: { code: 'aborted' } }` and does not toast.
- [ ] Request timeout (default 15s) aborts with `code: 'aborted'` (with a `details: { reason: 'timeout' }` flag).
- [ ] Auto-toast fires on unhandled errors unless `handleErrorInline: true` is set.
- [ ] `accept-language` header reflects the active next-intl locale.
- [ ] `credentials: 'include'` sends Clerk session cookies on every request.

## Functional — PWA

- [ ] `manifest.webmanifest` validates against the W3C manifest spec (Lighthouse PWA audit passes).
- [ ] App icons (192, 512, maskable variants) load and pass Lighthouse maskable icon check.
- [ ] Service worker registers on first visit and precaches the app shell + offline fallback page in both locales.
- [ ] Visiting `/[locale]/jobs` then going offline → reload renders the offline page (not a browser dinosaur).
- [ ] `beforeinstallprompt` fires and `<InstallPrompt>` renders the install card; clicking install triggers the native prompt.
- [ ] Dismissing the install card persists across reloads (localStorage flag).
- [ ] Once installed (`display-mode: standalone`), the install card is hidden permanently.
- [ ] iOS Safari shows the `<IosInstallHint>` instead of the native prompt; dismissal persists.
- [ ] `<OfflineBanner>` appears within 1s of `navigator.onLine === false` and disappears within 1s of reconnect.
- [ ] A new SW version surfaces an "update ready" toast; clicking refresh swaps to the new SW and reloads.
- [ ] `/admin/*` routes are not registered with the SW and never served from cache.
- [ ] Marketing routes (`/`, `/en`, `/es` landing) are not in SW scope; they remain crawlable and uncached.

## Non-functional

- [ ] Lighthouse PWA category passes on the worker dashboard route over throttled 4G on Pixel-class hardware.
- [ ] Lighthouse Performance ≥ 80, A11y ≥ 95, Best Practices ≥ 90 on the worker dashboard.
- [ ] First-load JS for the marketing landing < 100 KB gzipped (no `packages/api-client` or PWA wrapper bundled).
- [ ] First-load JS for the worker dashboard shell < 200 KB gzipped (excluding feature-specific bundles).
- [ ] Toast render latency < 50 ms from `toast()` call to first paint.
- [ ] Modal open/close animations honor `prefers-reduced-motion: reduce`.
- [ ] Service worker activation does not block the page (registration runs after `load`).

## Test scenarios

### Unit

1. **Envelope helpers** — `ok()` / `err()` produce correctly shaped responses with status codes; `validate()` middleware emits `fields` keyed by dotted path on zod failure.
2. **API client transport errors** — mock `fetch` to throw a network error → returns `{ ok: false, error: { code: 'offline' } }`.
3. **API client timeout** — mock a slow `fetch` → 15s default timeout aborts with `code: 'aborted'`.
4. **Toast dedupe** — call `toast({ dedupeKey: 'x' })` 3 times in 1s → only one visible, timer resets each time.
5. **Confirm destructive** — ESC press does not resolve the promise; only confirm/cancel buttons do.
6. **Form server errors** — `ctx.setErrors({ 'profile.email': '...' })` renders under the email Field and clears on edit.

### Integration

1. **End-to-end error flow** — a 422 from `/v1/onboarding` with `fields: { fullName: '...' }` renders as a `<FieldError>` under the right input without showing a toast.
2. **Auto-toast on 500** — a forced 500 from any endpoint shows a localized toast with the correlation id.
3. **Locale switch** — switch from EN to ES → next API call's `accept-language` is `es`; subsequent error messages are Spanish.
4. **Offline → online** — Chrome DevTools "offline" → navigate → offline page renders. Toggle online → banner disappears, navigation succeeds.
5. **SW update** — deploy a new SW build → reload → "update ready" toast appears; click refresh → new build active.
6. **iOS install hint** — UA-spoof iOS Safari → InstallPrompt does not render; IosInstallHint renders once; dismissal persists.

### Manual

1. Install the PWA on a real Pixel and a real iPhone. Confirm icons, splash, theme color, standalone mode.
2. Take a real worker through onboarding on a 3G-throttled device. Confirm forms work, errors localize, toasts read aloud with VoiceOver/TalkBack.
3. Spanish reviewer reviews every `shell.*` string against [docs/brand/04-voice.md](../../brand/04-voice.md) — sign-off recorded in the brand review log.
4. Color-contrast check on toast variants in both Tierra light and dark themes.
5. Screen reader pass: VoiceOver (iOS) + TalkBack (Android) read every toast and modal correctly in both EN and ES.

## Definition of done

- `packages/ui` ships with all primitives documented in [04-ui.md](04-ui.md).
- `packages/api-client` ships with the typed client + Hono server helpers documented in [03-api.md](03-api.md).
- An ESLint rule blocks direct `fetch()` in `apps/web/src/**` outside `packages/api-client` (use `useApi()` instead).
- An ESLint rule blocks hard-coded English strings in `packages/ui` (regex on JSX text content + string literals in known prop positions).
- A CI check validates the manifest, runs Lighthouse against the worker dashboard, and asserts thresholds.
- The i18n parity check (`packages/i18n/scripts/check-parity.ts`) runs in CI and fails on missing keys in either locale.
- The native Spanish reviewer has signed off on the `shell.*` namespace.
- Sentry is wired so every `internal_error` and every client `<ErrorBoundary>` mount is captured with the correlation id and component stack.
