# 09 — SEO & AIO: Acceptance Criteria

## Functional

- [ ] Every public page exports `generateMetadata` with title, description, canonical, hreflang alternates, OG image.
- [ ] Every job posting page renders valid `JobPosting` JSON-LD.
- [ ] Every training program page renders valid `EducationalOccupationalProgram` JSON-LD.
- [ ] Every public employer profile renders valid `Organization` JSON-LD.
- [ ] FAQ page renders valid `FAQPage` JSON-LD with at least 10 question/answer pairs (5 EN, 5 ES — but typically 10 each).
- [ ] Sitemap at `/sitemap.xml` lists all active jobs, training programs, employer profiles, and key static pages, in both locales.
- [ ] Robots.txt at `/robots.txt` allows GPTBot, PerplexityBot, ClaudeBot, Google-Extended; disallows `/admin/`, `/api/`.
- [ ] llms.txt at `/llms.txt` returns plain text describing the platform with key URLs.
- [ ] OG image route returns a 1200×630 PNG within 500ms (edge runtime).
- [ ] Canonical URL on every page matches the active locale and full path.
- [ ] All admin / dashboard / onboarding pages have `robots: noindex,nofollow`.

## Validation

- [ ] All JSON-LD validates against Schema.org via [validator.schema.org](https://validator.schema.org/) (manual spot-check at QA).
- [ ] Google Rich Results Test passes on at least one job posting page.
- [ ] Sitemap XML is well-formed (XML schema validation in CI).

## Performance

- [ ] Lighthouse SEO ≥ 95 on every public page (CI-gated).
- [ ] LCP < 2.5s mobile 4G on top 5 public pages (CI runs throttled Lighthouse).
- [ ] CLS < 0.1 on every public page.
- [ ] INP < 200ms on the jobs listing (which has filters/interactions).

## Indexing

- [ ] Within 7 days of launch, primary public URLs indexed in Google (verified via Search Console).
- [ ] No more than 5% of URLs reported as "Crawled - currently not indexed" 30 days post-launch.

## AIO

- [ ] Every public page has a direct-answer paragraph in the first 200 words.
- [ ] Image alt text is descriptive (not "image of...") and translated.
- [ ] llms.txt is keep updated as new public surfaces ship.

## Test scenarios

### Unit

1. `generateJobSlug` produces valid lowercase ASCII slug, ≤ 80 chars, with the year and county.
2. `jobPostingJsonLd` matches a hand-crafted golden JSON for a sample posting.

### Integration

1. **Sitemap completeness:** create 3 active jobs → sitemap contains all 3 URLs in both locales.
2. **Hreflang set:** GET a job page → response HTML contains `<link rel="alternate" hreflang="en" ...>` and `hreflang="es"`.
3. **OG image:** GET `/og/job/<id>` → returns a 1200×630 PNG.
4. **noindex on admin:** GET admin home with crawler UA → response contains `noindex` meta.

### Manual / external

1. Run [validator.schema.org](https://validator.schema.org) on 3 job pages, 2 training pages, FAQ page.
2. Run [Google Rich Results Test](https://search.google.com/test/rich-results) on a sample job page; assert "JobPosting" detected.
3. Submit sitemap in Google Search Console; verify zero errors.

## Definition of done

- All Phase 5 SEO/AIO checklist items in kickoff §13 implemented.
- Lighthouse CI integrated in GitHub Actions; thresholds documented in [10-infra-cicd](../10-infra-cicd/).
- Search Console + Bing Webmaster Tools properties verified.
- Authority content backlog drafted (titles + outlines, not full posts) — 10 articles for the resources section, to be written by content team.
