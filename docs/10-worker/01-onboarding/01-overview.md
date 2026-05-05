# 01 — Worker Onboarding: Overview

## Purpose

Get a Central Valley farmworker from "first tap on the app" to a fully populated profile able to apply for jobs, in under 5 minutes, in their preferred language, on a low-bandwidth phone connection.

## User

A monolingual Spanish-speaking farmworker on a 4-year-old Android device, possibly with intermittent connectivity, who has never used a job platform before. Many users have a paper resume or a PDF/Word resume from a community-college class; some have nothing. The flow must work for both.

## Goals

- 0 password barriers — phone + OTP only (no passwords ever).
- Spanish-first UX with one-tap EN toggle.
- Resume → structured profile in one upload, with every field editable.
- No abandoned-cart middle states: every step is either complete or resumable.

## Scope

In scope:

- Phone OTP signup via Clerk SMS
- Language preference selector (EN/ES)
- Resume upload (PDF or DOCX) → parsed JSON via [07-resume-parser](../../00-foundation/07-resume-parser/)
- Inline review & edit of parsed resume
- County selector (Fresno / Kern / Kings / Madera / Tulare)
- Skills tag picker (default tags + custom)
- Weekly availability bitmask (AM/PM × 7 days)
- Welcome SMS in preferred language
- Optional welcome email (only if user provides email)

Out of scope:

- Photo upload (post-MVP)
- Skills assessment / quizzes (post-MVP)
- Document verification — driver's license, work auth (legally fraught — out of scope)
- Resume re-upload during onboarding (use Resume Editor post-onboarding)

## Success criteria

- ≥ 80% of users who start onboarding complete it in one session.
- Median time-to-complete < 5 minutes (excludes resume parser latency).
- Spanish completion rate equals or exceeds English (i.e., translations don't bottleneck).
- Zero workers complete onboarding without at least one skill, county, and availability slot.

## Roles

Only role created by this flow: `worker`. Employer and training-org onboarding are separate flows and are NOT covered here.

## Dependencies

- [02-auth](../../00-foundation/02-auth/) — Clerk SMS OTP
- [01-multi-tenancy](../../00-foundation/01-multi-tenancy/) — workers are platform-level (bucket 2); `User.tenantId` stays null
- [04-i18n](../../00-foundation/04-i18n/) — bilingual strings infrastructure
- [05-sms-pipeline](../../00-foundation/05-sms-pipeline/) — welcome SMS + quiet hours
- [06-email-pipeline](../../00-foundation/06-email-pipeline/) — welcome email (optional)
- [07-resume-parser](../../00-foundation/07-resume-parser/) — resume → ResumeSchema JSON
- [02-resume-editor](../02-resume-editor/) — handoff target after onboarding completes
