# 02 — Resume Editor: Overview

## Purpose

Let workers edit their structured resume JSON directly — no re-upload required. Workers add jobs, update titles, fix typos, add or remove skills, and update certifications. Changes reflect immediately in their profile and in any data employers see.

This implements the kickoff §6 design principle: "Workers who update their job title, add a new skill, or fix a typo never need to upload a new resume."

## User

Same farmworker as onboarding. They've completed onboarding; now they want to update their info — typically when starting a new job, finishing a training course, or correcting a typo a friend pointed out.

## Goals

- Every field on `worker_profiles.resume` is editable.
- Changes save instantly without "Save" button friction.
- Worker can re-upload a new resume to overwrite the entire structure (rare flow but supported).
- Worker can also see a read-only "preview as employer" view to know what employers see.

## Scope

In scope:

- Edit contact (name, email, city, zip)
- Add / edit / remove experience items
- Add / edit / remove education items
- Add / remove skills (default + custom)
- Add / edit / remove certifications (manually — separate from training cert auto-grants)
- Add / remove languages
- Edit availability (weekly grid)
- Re-upload entire resume (re-trigger parser; warn before overwrite)
- Preview as employer

Out of scope:

- Resume file download from the structured data (PDF export of the editor view) — Phase 2
- Multiple resume versions per worker — Phase 2
- Photo / portfolio upload — out of scope
- Resume sharing via public link — Phase 2 (Skills Wallet covers cert sharing)

## Success criteria

- Median edit-and-save flow < 10 seconds.
- Autosave success rate > 99% (no lost changes from network issues).
- 60% of returning workers edit their profile within 30 days of onboarding.
- Zero workers permanently lose data via re-upload (warn-before-overwrite + audit trail).

## Dependencies

- [01-onboarding](../01-onboarding/) — produces the initial `resume` JSON
- [00-foundation/07-resume-parser](../../00-foundation/07-resume-parser/) — invoked on re-upload
- [00-foundation/04-i18n](../../00-foundation/04-i18n/) — strings
- [00-foundation/03-database](../../00-foundation/03-database/) — `worker_profiles` schema
