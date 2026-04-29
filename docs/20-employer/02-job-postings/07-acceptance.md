# 02 — Job Postings: Acceptance Criteria

## Functional

- [ ] Verified employer can create draft postings without limit; pending employers can also create drafts (just can't publish).
- [ ] Publish requires `flcVerifiedAt != null`; otherwise 403.
- [ ] Free-plan employers cannot have more than 2 active postings (atomic enforcement).
- [ ] Required bilingual fields (`title_en`, `title_es`, `description_en`, `description_es`) validated at submit AND DB CHECK.
- [ ] Wage min ≤ max validated.
- [ ] End date ≥ start date validated.
- [ ] On publish, `seoSlug` generated and unique.
- [ ] Active postings: only allowed fields can be edited.
- [ ] Closing a posting transitions status; reapplying is blocked at the worker side.
- [ ] LLM translation endpoint produces valid output for typical inputs; failures surface clearly to the employer.

## Non-functional

- [ ] Listing P95 < 200ms with 1000 postings per employer.
- [ ] Translation latency < 5s typical.
- [ ] Autosave latency < 1s after blur.

## SEO

- [ ] Published postings appear in `/sitemap.xml` within 5 minutes.
- [ ] `JobPosting` JSON-LD valid (per [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/)).

## Test scenarios

### Unit

1. CreateJobBody validation: missing ES title rejected; wage_max < wage_min rejected; end_date before start_date rejected.
2. Edit-on-active rules: PATCH `wageMin` on active posting → 422; PATCH `descriptionEn` → success.
3. Slug generation: 100 generations across same county+title → all unique (no collision in tests).

### Integration

1. **Plan-limit enforcement:** Free employer with 2 active → publish 3rd → 402 `plan_posting_limit`.
2. **Concurrent publish race:** two simultaneous publish requests for the 2nd posting; only one succeeds.
3. **Verification gate:** unverified employer publish → 403 `employer_not_verified`.
4. **Sitemap inclusion:** publish a posting → GET `/sitemap.xml` shows it within 60s (cache TTL).
5. **Cross-tenant isolation:** Employer A in Tenant 1 cannot see / edit Employer B's job in Tenant 2.

### E2E (Playwright)

1. Verified employer creates a posting end-to-end with translation help → publishes → previews → sees it on public `/jobs`.
2. Posting fields edited (allowed + forbidden) — UI surfaces appropriate enable/disable.
3. Close action transitions posting and removes from public listings.

## Definition of done

- All state transitions covered by tests.
- LLM translation prompt versioned and committed; cost per translation logged.
- Slug collision retry logic verified by injection test.
- Admin runbook: how to take down an inappropriate posting (status → closed, deletedAt set, reason logged in `auth_events`).
