# 04 — Resources: Acceptance Criteria

## v1 (launch — empty-state only)

- [ ] `/[locale]/resources` renders for both `en` and `es` with the empty-state layout.
- [ ] Empty-state body explains "coming soon" in plain language; offers email signup.
- [ ] Subscribe form posts to `POST /v1/landing/waitlist` with `source: 'landing.resources_waitlist'`.
- [ ] Subscribing produces a confirmation email per the landing waitlist flow.
- [ ] Suggest-a-topic mailto link uses `editorial@agconn.com` with default subject.
- [ ] `(marketing)` layout chrome renders correctly (utility bar, nav, footer).
- [ ] `marketing.resources.*` i18n keys present in both locales.
- [ ] Sitemap includes `/en/resources` and `/es/resources` with `priority: 0.5`.
- [ ] Footer "Resources" link visible (or hidden if explicitly chosen during visual review).
- [ ] Lighthouse mobile (Slow 4G): SEO ≥ 95, Performance ≥ 90, A11y ≥ 95.

## v2 (post-launch — full article system)

- [ ] At least 4 articles published, two each in EN and ES, with full hreflang pairing.
- [ ] Article index `/[locale]/resources` lists all articles for that locale, filtered by category.
- [ ] Category index `/[locale]/resources/category/[category]` lists only that category's articles.
- [ ] Article detail `/[locale]/resources/[slug]` renders MDX with Tierra typography.
- [ ] Each article emits valid `Article` JSON-LD.
- [ ] Sitemap auto-includes every article slug with `priority: 0.6`.
- [ ] OG image per article (`/og/article/[slug]`) renders 1200×630 PNG within 500ms.
- [ ] Reading-time estimate matches actual word count (200 wpm baseline).
- [ ] Article ToC scroll-spy highlights active section while reading.
- [ ] Articles published in EN must have ES counterpart with matching `slug` frontmatter.

## SEO / AIO

- [ ] All resources pages: title ≤ 60 chars, description ≤ 160 chars, canonical, hreflang en/es/x-default.
- [ ] `Article` JSON-LD validates against [validator.schema.org](https://validator.schema.org/) (v2).
- [ ] Direct-answer paragraph in the first 200 words of every article (v2).
- [ ] No duplicate-content issues (each article unique per locale; no re-purposed copy).

## Accessibility

- [ ] Lighthouse a11y ≥ 95 on every resources page.
- [ ] Keyboard navigation reaches every interactive element in source order.
- [ ] Article headings semantically ordered (no skipped levels).
- [ ] Hero images have alt text in the active locale.
- [ ] Color contrast verified per [brand/02-color.md](../../brand/02-color.md).

## Bilingual

- [ ] CI: `check-i18n-parity` passes for `marketing.resources.*` keys.
- [ ] v2: every article has both EN and ES counterparts; CI lint blocks merge if a new article ships in only one locale.
- [ ] Native Mexican-Spanish reviewer signs off on ES copy before publish.

## Test scenarios

### v1 Unit

1. `/[locale]/resources` renders empty-state copy for both locales.
2. Subscribe form posts to `/v1/landing/waitlist` with `source: 'landing.resources_waitlist'`.
3. Suggest-a-topic mailto includes `subject=Topic suggestion`.

### v1 E2E (Playwright)

1. Visit `/es/resources` → empty-state visible; subscribe form present; nav and footer render.
2. Submit subscribe form with `editor@example.com` → 200 response, success state shown.
3. Toggle to EN: `/en/resources` → page reloads in English.

### v2 (post-launch)

1. Article index lists 4+ articles with category chips and sort toggle.
2. Filter by `employer-guides` → only employer-guide articles visible; URL updates to `/resources/category/employer-guides`.
3. Article detail page: hero image renders, ToC sticky on desktop, MDX components rendered with Tierra typography.
4. Article OG image for share renders correctly on Twitter card preview.

## Definition of done

### v1

- Empty-state route shipping with subscribe form.
- Sitemap entries verified.
- i18n keys present.
- Lighthouse CI green on `/en/resources` and `/es/resources`.

### v2

- Article system shipping with 4+ articles.
- All v2 functional + SEO + a11y + bilingual criteria pass.
- Editorial workflow documented (PR template for new articles).
- Sitemap auto-population verified.
