# Phase 2 — Worker Web Onboarding

Severity: P0. Depends on Phase 0. Runs **parallel to Phase 1** (separate surfaces).
Goal: make the web wizard actually finish, and gate access behind it.

## 2.1 Fix post-move 404 navigation

The folder moved `/[locale]/onboarding/*` → `/[locale]/worker/onboarding/*` but all
navigation still targets the deleted path. Fix and centralize so it cannot regress:

- Create one `ONBOARDING_STEPS` route map (single source of step order + paths).
- Re-point every call site at it: `NameForm.tsx:65`, `CountyPicker.tsx:32,55`,
  `SkillsPicker.tsx:65`, `AvailabilityGrid.tsx:56`, `ResumeUpload.tsx:36`,
  `apps/web/src/app/[locale]/worker/onboarding/page.tsx:7`,
  `.../worker/onboarding/language/page.tsx:9`.

## 2.2 Wire the finalize

`complete/page.tsx` never calls the orphaned `completeOnboardingAction`
(`apps/web/src/lib/api/onboarding-actions.ts:52`). Wire it →
`POST /v1/onboarding/complete` → `services/api/src/worker/onboarding/service.ts:164-197`
(sets `WorkerProfile.onboardedAt` + `User.onboarded=true`). Add a server-side
`422 { missing: [...] }` guard when county/skills are absent (consistent with
`docs/10-worker/01-onboarding/07-acceptance.md:24`).

## 2.3 Persist availability server-side

`AvailabilityGrid.tsx:45-54` writes only to `localStorage`. Add a
`PATCH /v1/onboarding/profile` write validated against `AvailabilitySchema`.
`localStorage` stays a resume-draft only, never the source of truth.

## 2.4 Gate access (mirror employer)

**Decision (owner, 2026-05-18): one gating mechanism app-wide.** Rather than add a
second mechanism for worker, mirror the employer route-group pattern exactly so the
whole app gates identically. DONE:

- `GET /v1/me` now returns `user.onboarded`; `MeResponse`, `ResolvedRole`,
  `resolveRole`, and `requireRole` carry it. `requireRole`'s default
  `onboardingPath` corrected from the stale `/[locale]/onboarding` to
  `/[locale]/worker/onboarding`.
- **`worker/(shell)/` route group** created (mirrors `employer/(shell)/`): the old
  `worker/layout.tsx` + all gated route folders (`dashboard`, `jobs`,
  `applications`, `profile`, `documents`, `messages`, `pay`, `saved-searches`,
  `shifts`, `training`, `wallet`, `me`, `[...notFound]`, `not-found.tsx`) moved into
  it via `git mv`. `worker/onboarding/` stays at `worker/` level as a layout-less
  sibling, Clerk-authed by the global middleware exactly like `employer/onboarding/`.
  Route groups don't change URLs, so `/worker/...` is unchanged.
- `worker/(shell)/layout.tsx` adds the gate after `requireRole(worker)`:
  `if (!onboarded) redirect('/[locale]/worker/onboarding')`. The redirect target is
  outside `(shell)`, so it cannot loop.
- `field/layout.tsx` gets the same auth + onboarded gate (it had none); `/field`
  has no onboarding child, so no loop.

> **Finding (2026-05-18):** `/resume/status` is *not* "always failed" — it returns
> `parsed` when a resume exists, `failed` only on `parserStatus==='failed'`, else
> `parsing`. A skip link (`resume.dont` → profile) already exists, so onboarding is
> **already non-blocking**. The only remaining dishonesty: with no parser deployed,
> `reupload` sets `parserStatus='parsing'` and the client polls 20× then shows a red
> "parse failed" screen before auto-advancing — claiming failure when nothing ran.
> The fix below is a UX-honesty refinement (terminal `unsupported`/skip state instead
> of fake `failed`), not a blocker. Deferred from the blind pass: it changes the
> status contract + client phase union and wants app-run/tests to land safely.

## 2.5 Resume parser honesty

The resume endpoints are stubbed to always return `failed`. Make resume explicitly
**optional / non-blocking** with an honest `skipped` state (consistent with
`docs/10-worker/01-onboarding/07-acceptance.md:9`). The real parser is a separate
workstream — out of scope here ([08-risks-and-scope.md](08-risks-and-scope.md)).

## Done when

A worker completes the wizard with zero 404s; `onboarded`/`onboardedAt` are set on
finalize; an incomplete profile returns 422; availability survives a device change;
an un-onboarded worker hitting `/worker` or `/field` is redirected into onboarding.
Tests cover each.
