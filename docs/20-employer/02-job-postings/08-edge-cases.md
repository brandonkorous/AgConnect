# 02 — Job Postings: Edge Cases & Risks

## LLM translation hallucination / inaccuracy

Translation introduces meaning shifts. Wages, dates, locations might transcribe wrong.

**Mitigations:**

- Translation prompt instructs to preserve numbers, dates, and proper nouns verbatim.
- The translated field is editable; visible "Review this" prompt nudges employer review.
- Common-pattern guardrail: regex check that `wage_min`/`wage_max` numbers in the translated text match the form's structured wage fields.

> **Inferred:** The structured wage and date fields are the source of truth, NOT the description text. If a translation says $20 but the wage field says $18, workers see $18 — the misleading text in the description is the employer's responsibility to clean up. Tests verify the structured fields aren't modified by translation.

## Bait-and-switch via active edit

Employer publishes "$22/hr Strawberry Picker", attracts applications, edits to "$15/hr".

**Mitigation:**

- Active-job edit policy disallows wage / county / dates changes.
- Description edits allowed (employer may need to clarify) but `auth_events` logs the diff for admin review.

## Slug squatting

Employer A publishes "fresno-tractor-operator-2026"; Employer B wants the same slug.

**Mitigation:** unique constraint + 4-char hex suffix makes collision rare. Slugs include the employer's posting ID's hex; other employers can use similar slugs with different suffixes.

## Auto-saved drafts pollute the dashboard

Employer abandons a half-typed draft 50 times → 50 stale drafts.

**Mitigation:**

- Drafts > 30 days old with no edits are auto-archived (soft-deleted) by a cron job. Out of scope for MVP code; add as a chore.
- Dashboard lists drafts oldest-last; stale ones drop to bottom.

## Posting filled before announcement

Employer hires someone offline, marks the posting `filled`. Workers who applied get `rejected` status (because the position is filled and they weren't picked).

**Mitigation:**

- When employer transitions `active → filled`, all `applied` and `reviewed` applications stay in their status (they're "still in process from the worker's perspective"). The employer must explicitly reject or hire each one.
- Or: Worker UX shows posting status as "Filled" with a banner: "This posting was filled. The employer is reviewing remaining applicants."
- Mass-reject button available in the applicant review feature — see [03-applicant-review](../03-applicant-review/).

## Date / wage edge cases

- Past start date posted: allowed (employer may post a job already begun for late applicants).
- Wage < California minimum wage (~$16/hr in 2026): warned, not blocked. Compliance is the employer's responsibility.

> **Inferred:** Don't enforce minimum wage at the platform level — laws change, exemptions exist, and false positives erode trust. Display a soft warning and let the employer confirm.

## Plan downgrade with > 2 active postings

Employer downgrades from Pro to Free with 5 active postings.

**Behavior:**

- Existing 5 postings remain active.
- Cannot publish more until count drops below 2.
- Stripe webhook catches the downgrade and updates `plan` in DB.

> **Inferred:** Don't auto-close postings on downgrade — punitive and bad worker experience. New publishes blocked instead.

## County change between create and publish

Draft created with `county: Fresno`; employer edits to Kern at publish time. Slug generated from county at publish. No issue.

## Long descriptions

Employer pastes a 5000-char description. UI truncates to schema max with a counter.

## Foreign-language description in EN field

Employer pastes Spanish into the English field by mistake. We don't auto-detect — would require LLM call per submit (overkill).

**Mitigation:**

- Field labels clear ("Description (English)").
- Translation button helps: paste in either language, translate to the other.
- Manual review by admin if reported.

## Concurrent edit (two browser tabs)

Same as resume editor — `If-Unmodified-Since` header → 409 conflict on stale write.

## Application count denormalization drift

`applicationCounts` derived live or denormalized?

**Decision (MVP):** derived live from `applications` table per response. With per-posting limits in the hundreds, COUNT() is cheap. Move to denormalized counter if perf requires.

## Indexed metadata on live page changes

Search engines may have indexed wage = $22; employer edits description (allowed); search engine eventually re-crawls.

**Behavior:** acceptable. JSON-LD reflects the current values; Google's rich-result update lag is fine.

## Soft-delete during applications

Employer deletes (soft) a posting that has 5 applications.

**Behavior:**

- `job_postings.deletedAt` set.
- Applications remain (the worker history matters for grant reporting).
- Public job page returns 410.
- Worker's application detail page still shows the application; status timeline notes "Posting was withdrawn by employer."

## Open questions

1. Job templates / clone-from-existing — Phase 2 priority.
2. Wage benchmarks — surface county / season averages? Privacy and gaming concerns; defer.
3. Application screening questions ("Do you have a tractor license?") — Phase 3 if employers ask.
4. Auto-close on filled count reaching `positionsTotal` — auto vs manual? Default manual; add toggle later.
