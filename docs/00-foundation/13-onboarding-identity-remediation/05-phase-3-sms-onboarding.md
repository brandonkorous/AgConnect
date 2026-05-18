# Phase 3 — SMS Worker Micro-Onboarding

Severity: P0 outcome. Depends on Phase 1. Goal: make the SMS-first worker
**matchable**, and close the silent `JOBS` dead-end that started this investigation.

A Clerk identity (Phase 1) is not a `WorkerProfile`. `automatch`
(`services/sms-worker/src/automatch.ts`) pre-filters by `WorkerProfile.county` and
scores on `skills`. Without those the worker is invisible. This phase captures the
minimum to be matchable, over SMS.

## 3.1 SMS onboarding state machine

After `confirmOptIn` (consented) with no/incomplete `WorkerProfile`, enter an SMS
onboarding flow. Track step via an extended `smsOptInState` or a new
`smsOnboardingStep` column. Inbound routing resolves the active step **before**
keyword routing. Idempotent (re-send safe). STOP always wins.

## 3.2 Three bilingual prompts

Strings via DB-backed `translation_keys` seed bundles + reseed — never edit
`messages/{en,es}.json` (see `[[feedback_bilingual_by_design]]`).

1. **Name** → `firstName` / `lastName`.
2. **County** → numbered pick-list `1 Fresno … 5 Tulare`, sharing the **same County
   enum source** as web `CountyPicker`. Unsupported reply → waitlist parity with the
   web `waitlist` step.
3. **Skills** → numbered pick-list from the **same skills vocabulary** as web
   `SkillsPicker`. Shared source — not a hand-kept second list.

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

## Done when

An SMS-only worker completes name/county/skills in EN or ES, becomes
`automatch`-visible, receives a real job digest on `JOBS`, and never hits silence.
Tests: full happy path EN+ES, partial/resume, unsupported-county waitlist, digest for
a complete worker, holding reply for an incomplete one.
