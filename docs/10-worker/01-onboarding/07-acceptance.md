# 01 — Worker Onboarding: Acceptance Criteria

## Functional

- [ ] User can complete onboarding using only their phone (no email required at any step).
- [ ] User can complete onboarding entirely in Spanish — every screen, error, and the welcome SMS in ES.
- [ ] User can switch language at any step; switch persists immediately and applies retroactively to remaining steps and to the welcome SMS.
- [ ] Resume upload supports PDF and DOCX up to 10 MB.
- [ ] Resume parser failure does not block onboarding — user proceeds to manual entry without losing progress.
- [ ] On `complete`, `users.preferredLang`, `worker_profiles.county`, `skills`, and `availability` are all set.
  - **SMS-channel deviation (Phase 3, 2026-05-18):** SMS micro-onboarding collects
    county + name + skills only and defaults `availability` to fully-available; the
    worker refines availability on the web. Conscious, documented deviation — see
    `docs/00-foundation/13-onboarding-identity-remediation/05-phase-3-sms-onboarding.md`.
- [ ] Welcome SMS arrives in user's preferred language within 5 minutes of `complete` (or after 7 AM PT if quiet hours).
- [ ] Browser refresh at any onboarding step resumes at the correct step (server-derived `next_step`).
- [ ] If the user closes the tab mid-flow and returns, IndexedDB-cached unsaved fields are restored.
- [ ] Authenticated worker with `onboardedAt = null` is redirected to the next incomplete step on every page load.
- [ ] Authenticated worker with `onboardedAt != null` is NOT redirected — they go where they navigated.
- [ ] User who picks an unsupported county can submit waitlist info; their account remains active for re-prompt later.

## Edge cases (must pass)

- [ ] Phone number already exists on another worker User row → `409 phone_collision` with helpful message ("Use another number or contact support") and admin-merge fallback path.
- [ ] Resume parse takes > 60s → UI offers manual fallback; pg-boss job continues server-side and resume populates on next visit if it eventually completes.
- [ ] User uploads a 12 MB resume → `413 resume_too_large` with size guidance, no upload happens.
- [ ] User uploads an image (.jpg) → `415 resume_unsupported` with format guidance.
- [ ] User completes onboarding with 0 selected skills → `422 profile_incomplete` with `missing: ['skills']`.
- [ ] OTP entered after 10-min expiry → friendly "code expired, resend" prompt, not a generic error.
- [ ] User opts in to email then deletes it before completing → no welcome email enqueued.
- [ ] User's Clerk session expires mid-flow → redirect to `/sign-in` with banner "Sign in again to continue where you left off."

## Performance

- [ ] First contentful paint < 1.5s on a Moto G7 over 3G (Lighthouse mobile).
- [ ] Resume upload progress visible within 200ms of file selection.
- [ ] Polling for parse status uses < 5 KB/poll (response is `{status: 'parsing'}` — about 22 bytes).
- [ ] Total wire transfer for entire onboarding (excl. resume binary) < 250 KB.

## Accessibility

- [ ] Lighthouse a11y score ≥ 95 on every onboarding route (gated in CI).
- [ ] Keyboard-only completion possible end-to-end (manual test before each release).
- [ ] Screen reader (NVDA + TalkBack) announces each step's progress and any inline errors.
- [ ] Reduced-motion users do not see any non-essential animation.

## i18n

- [ ] No hardcoded English strings in any onboarding component (linter rule blocks `'[A-Z]'` outside `t()` calls in `apps/web/app/[locale]/onboarding/**`).
- [ ] Every `en.json` key used by onboarding has a corresponding `es.json` key (CI script `check-i18n-parity`).
- [ ] Every error code returned by `/v1/onboarding/*` has an EN+ES message.

## Test scenarios

### Manual

1. **Happy path ES:** complete in Spanish from scratch with a real PDF resume from a Central Valley community college template. Verify welcome SMS arrives in Spanish within 5 minutes.
2. **Happy path EN with skip:** English, skip resume upload, manual profile entry, complete.
3. **Bad resume:** upload an image-only PDF (no extractable text); confirm fallback flow → manual entry → still completable.
4. **Slow network:** throttle Chrome DevTools to "Slow 3G"; confirm no UI deadlock and resume parse poll continues.
5. **Mid-flow language switch:** switch ES→EN at the skills step; confirm prior fields preserved and remaining steps in EN.
6. **Returning user:** complete steps 1–5, close tab, reopen; confirm step 6 is the resume point.
7. **Unsupported county:** pick "Other" → waitlist form → submit; confirm `waitlist` row inserted with correct `preferredLang`.

### E2E (Playwright)

`e2e/onboarding/happy-path-es.spec.ts`, `happy-path-en.spec.ts`, `parse-failure-fallback.spec.ts`, `resume-mid-flow.spec.ts`. Each runs against a fresh tenant via `withTestTenant` helper.

## Definition of done

- All happy paths and edge cases above pass in CI.
- Lighthouse mobile score: Performance ≥ 80, A11y ≥ 95, Best Practices ≥ 90.
- A native Spanish speaker has reviewed and approved [05-i18n.md](05-i18n.md) strings (or filed corrections).
- An admin has dry-run a tenant + worker creation end-to-end on staging.
