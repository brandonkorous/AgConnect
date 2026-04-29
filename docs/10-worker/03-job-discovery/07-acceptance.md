# 03 — Job Discovery: Acceptance Criteria

## Functional

- [ ] Anonymous users can browse `/jobs` and view individual job pages without sign-in.
- [ ] All filters (county, skills, wage, dates, q) combine correctly: a job appears only if it matches every active filter.
- [ ] Search query (`q`) matches against bilingual FTS column (jobs in either language match).
- [ ] Each job card links to `/jobs/<seoSlug>`; closed/expired jobs return 410 Gone.
- [ ] `/jobs/<slug>` renders `JobPosting` JSON-LD with valid Schema.org structure.
- [ ] Authenticated workers see "Apply now"; anonymous see "Sign in to apply" with redirect.
- [ ] Workers who already applied see "Applied {date}" instead of Apply CTA.
- [ ] Saved search creation persists filters and alert settings; appears in `/saved-searches`.
- [ ] Saved search dispatcher fires within 5 minutes of a new matching job (excluding quiet hours).
- [ ] Worker without phone cannot create SMS-alert saved search (`422 phone_required`).
- [ ] Recommendations on dashboard prioritize jobs matching the worker's county AND skills, ordered by skill-match count.

## Non-functional

- [ ] `/v1/jobs` P95 latency < 200ms with 10k active jobs.
- [ ] Listing page LCP < 2.5s on mobile 4G.
- [ ] Job detail page LCP < 2.0s (smaller bundle).
- [ ] FTS search returns relevant results in either EN or ES query.
- [ ] Pagination via cursor avoids deep-OFFSET slowness.

## SEO

- [ ] All active job pages indexed by Google within 7 days of post.
- [ ] `JobPosting` JSON-LD passes [Google Rich Results Test](https://search.google.com/test/rich-results).
- [ ] hreflang alternates EN/ES on every detail page.
- [ ] Sitemap includes all active jobs.

## Test scenarios

### Unit

1. Filter SQL with combinations of `county`, `skills`, `wageMin`, `wageMax` returns expected rows on a fixture.
2. Recommendations query orders by intersection cardinality.
3. `SavedSearchFiltersSchema` rejects unknown keys.

### Integration

1. **Anonymous browse:** GET `/v1/jobs` without auth → 200 with active jobs, no `applicationStatus` fields.
2. **FTS bilingual:** seed a job with `titleEn='strawberry picker'`, `titleEs='cosechador'`. Query `?q=cosechador` returns the job. Query `?q=strawberry` returns it too.
3. **Saved search alert:** create saved search → post a matching new job → wait > 5 min → SMS sent (verified via `sms_log`).
4. **Quiet hours:** post a matching job at 22:00 PT → dispatcher sees the match → SMS held → delivered at 07:00 PT.
5. **RLS on saved searches:** worker A cannot list, edit, or delete worker B's saved searches.

### E2E (Playwright)

1. Browse `/jobs`, apply county + skill filter, save search → check `saved-searches` page shows the entry.
2. Open a job detail, sign in via Apply CTA, complete sign-in → returned to job page with apply unblocked.
3. Toggle saved-search SMS alert off → next matching job posted → no SMS (verify `sms_log` filter).

## Definition of done

- All filter combinations covered by integration tests.
- `JobPosting` JSON-LD validated for top 5 sample jobs in CI.
- Lighthouse SEO ≥ 95 on listing and detail.
- Sentry tags every search query with anonymized filters for debugging dead-end searches.
- Admin runbook: how to inspect why a saved search isn't firing.
