# Phase 3 — SMS Worker Micro-Onboarding

Severity: P0 outcome. Depends on Phase 1. Goal: make the SMS-first worker
**matchable**, and close the silent `JOBS` dead-end that started this investigation.

A Clerk identity (Phase 1) is not a `WorkerProfile`. `automatch`
(`services/sms-worker/src/automatch.ts`) pre-filters by `WorkerProfile.county` and
scores on `skills`. Without those the worker is invisible. This phase captures the
minimum to be matchable, over SMS.

> **Recon corrections (2026-05-18) — implemented:**
> - **Bilingual mechanism:** SMS copy is the static, var-typed registry
>   `packages/sms/src/templates/index.ts` (`en`/`es` literals + `vars`), **not** the
>   DB-backed `translation_keys` system (that rule is web/next-intl only). New SMS
>   strings are added there with EN+ES together — the established pattern. The
>   earlier "translation_keys seed bundles" line was wrong for SMS.
> - **RLS:** `worker_profiles_service` policy is `app.role IN ('service','webhook')`,
>   so the inbound webhook (`app.role='webhook'`, as `confirmOptIn` already uses) may
>   create `WorkerProfile` and finalize **inline** — no extra queue/consumer needed.
> - **Shared sources:** County = the `County` enum from `@agconn/db` (numbers 1–5).
>   Skills = `SKILL_SLUGS` from `@agconn/schemas` (the documented single source of
>   truth for valid skill slugs), presented as a curated numbered subset. Note: web
>   `SkillsPicker` uses its own drifted list; `SKILL_SLUGS` is the canonical source,
>   so SMS uses that (reconciling the web list is out of scope here).
> - `sms.optin.welcome` **already** prompts for county (`1=Fresno…5=Tulare`); the
>   flow reuses it as the county prompt and `confirmOptIn` sets step `await_county`.

## 3.1 SMS onboarding state machine

After `confirmOptIn` (consented), `smsOnboardingStep` is set to `await_county`. New
`User.smsOnboardingStep` (`await_county|await_name|await_skills|null`) and
`User.smsOnboardingDraft` (Json: partial `{county,firstName,lastName}` held until the
`WorkerProfile` is created at the end — the profile can't exist partially because
`firstName`/`lastName` are non-null). Inbound routing resolves the active step
**before** keyword routing, after STOP and `pending_confirm`. Idempotent (re-send
safe). STOP always wins.

## 3.2 Three bilingual prompts (static SMS registry)

Order follows the existing welcome copy: **county → name → skills**.

1. **County** → reuse `sms.optin.welcome` (`1=Fresno…5=Tulare`); invalid → re-prompt
   `sms.onboard.invalid_county`. County values from the `@agconn/db` `County` enum.
2. **Name** → `sms.onboard.ask_name`; first token → `firstName`, rest → `lastName`
   (falls back to first token if a single word).
3. **Skills** → `sms.onboard.ask_skills`, a numbered subset of `SKILL_SLUGS`
   (`@agconn/schemas`); reply parses digits → slugs.

## 3.3 Availability — conscious channel deviation

Default to all-available; tell the worker they can refine on the web. Record this as
a deliberate SMS-channel deviation from `docs/10-worker/01-onboarding/07-acceptance.md:10`
(which requires availability at web `complete`) by amending that file — docs are
source of truth, the deviation must be written down, not silent.

## 3.4 Completion reuses the web finalize

On the final answer, write `WorkerProfile` (`id = user_*`) and call the same
`service.completeOnboarding` path as Phase 2 to set `onboardedAt` + `onboarded=true`.
The worker is now visible to `automatch`.

## 3.5 Close the `JOBS` dead-end

`twilio.ts:177` currently falls through to a silent empty `<Response/>` for a
consented worker re-texting `JOBS`. After this phase:

- **Consented + complete** → matched-jobs digest: reuse `automatch.ts` scoring
  inverted (score active jobs for this worker), top 3, each line carrying that job's
  `smsApplyKeyword` so a reply routes into the existing `handleJobApply`.
- **Consented + incomplete** → a holding / continue-onboarding prompt (resume the
  3.1 state machine), never silence.

## Status — IMPLEMENTED 2026-05-18 (typecheck + check:conventions clean)

- Schema: `User.smsOnboardingStep` + `smsOnboardingDraft`; migration
  `20260518120000_sms_onboarding_step` (BEGIN/COMMIT); prisma client regenerated.
- Templates: `sms.onboard.invalid_county|ask_name|ask_skills|done`,
  `sms.jobs.digest|none` added to the static registry (EN+ES).
- `confirmOptIn` sets `await_county` (welcome SMS already asks county).
- `twilio.ts` state machine resolves the active step **before** keyword routing and
  **after** STOP/`pending_confirm` (STOP always wins; idempotent via step). County
  parses 1–5 or name; name → first/last; skills → digits → `SMS_SKILLS` (typed
  against canonical `SkillSlug`). Completion upserts `WorkerProfile` and reuses
  `completeOnboarding` (ALL_AVAILABLE satisfies its availability check), clears
  step/draft, sends `sms.onboard.done`.
- `JOBS` from a consented worker: mid-flow → step re-prompt (no silence);
  complete → county-scoped top-3 digest with each job's apply code; no county →
  re-enter onboarding; no jobs → `sms.jobs.none`. The `twilio.ts:177` dead-end is
  closed.

**Deferred:** the digest is county-filtered + recency-ordered, not the full
`automatch` skill-weighted score. Reusing `automatch`'s scoring cross-service needs
it extracted to a shared package — tracked as a follow-up, not a blocker (county
scoping already matches `automatch`'s own pre-filter). Tests deferred per owner (no
repo test framework).

## Done when

An SMS-only worker completes name/county/skills in EN or ES, becomes
`automatch`-visible, receives a real job digest on `JOBS`, and never hits silence.
(Verification pending tests + an app-run; type/convention-clean as of 2026-05-18.)
