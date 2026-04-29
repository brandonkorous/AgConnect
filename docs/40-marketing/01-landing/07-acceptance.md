# 01 — Landing Page: Acceptance Criteria

## Functional (per version)

### v1 (Phase A — Week 1)

- [ ] All 18 sections from [04-ui.md](04-ui.md) render at desktop, tablet, mobile breakpoints.
- [ ] All static copy from [05-i18n.md](05-i18n.md) renders in EN and ES, with locale-prefixed routes (`/en`, `/es`) and a `/` redirect to `/es`.
- [ ] No hardcoded English strings in marketing components (CI: `no-hardcoded-strings` ESLint rule).
- [ ] Featured Jobs, Featured Training, Impact Numbers, Testimonials sections render mock data clearly labeled `PLACEHOLDER`.
- [ ] Waitlist endpoint accepts email or phone, rate-limited at 10/hr and 30/day per IP.
- [ ] Waitlist confirmation email arrives within 60s when email is provided.
- [ ] Sitemap (`/sitemap.xml`) lists `/`, `/en`, `/es`, `/en/faq`, `/es/faq`.
- [ ] Robots.txt (`/robots.txt`) present, allows AI crawlers, disallows `/admin/`, `/api/`.
- [ ] llms.txt (`/llms.txt`) present with the canonical content from [00-foundation/09-seo-aio/02-data-model.md](../../00-foundation/09-seo-aio/02-data-model.md).
- [ ] OG image at `/og/landing?locale=es` renders 1200×630 PNG within 500ms (edge runtime).
- [ ] Standalone `/[locale]/faq` route renders the FAQ section + valid `FAQPage` JSON-LD.
- [ ] `Organization` JSON-LD on every landing route.
- [ ] Hero CTAs route to `/coming-soon` (or directly to Clerk if auth ships in Phase 0).

### v2 (end of Phase 1)

- [ ] Featured Jobs section renders real data from `/v1/landing/featured-jobs` with 4 cards.
- [ ] Each Featured Job card links to `/jobs/[slug]` and renders `JobPosting` JSON-LD on detail.
- [ ] Hero "Find work today" CTA routes directly to Clerk SMS-OTP signup.
- [ ] Hero "Hire a verified crew" CTA routes to employer onboarding entry.
- [ ] Final CTA worker form creates a real Clerk-hosted phone-OTP session and routes the user through onboarding on success.
- [ ] Final CTA employer form creates a real Clerk magic-link request.

### v3 (end of Phase 4)

- [ ] Featured Training section renders real data from `/v1/landing/featured-training` with 4 cards.
- [ ] Impact Numbers section renders real data from `/v1/landing/impact`, with suppression for tiles below 25 individuals.
- [ ] At least one real, partner-approved testimonial replaces the v1 placeholder for each role (worker / employer / training org).
- [ ] Public dashboard link in Impact section routes to a working `/[locale]/impact` page (or a roadmap page if not yet built).

## Non-functional

- [ ] Lighthouse mobile (Slow 4G, Moto G7): SEO ≥ 95, Performance ≥ 80, Accessibility ≥ 95, Best Practices ≥ 90 — gated in CI for `/`, `/en`, `/es`, `/en/faq`, `/es/faq`.
- [ ] LCP < 2.5s, CLS < 0.1, INP < 200ms on every public landing route.
- [ ] Total client JS on initial landing render < 50 KB gzipped.
- [ ] No hydration mismatch warnings in production build.
- [ ] Hero phone mockup is HTML/CSS, not a PNG (verified by inspecting DOM).
- [ ] Page works without JavaScript: hero copy, sections, FAQ items (all expanded), nav, footer all render and links work.

## SEO / AIO

- [ ] All page metadata: title (≤ 60 chars), description (≤ 160 chars), canonical, hreflang en/es/x-default, OG image, Twitter card.
- [ ] JSON-LD validates against [validator.schema.org](https://validator.schema.org/) for `Organization`, `WebSite`, `FAQPage`, sample `JobPosting` (v2+), sample `EducationalOccupationalProgram` (v3+).
- [ ] Direct-answer paragraph in the first 200 words on the landing page (the hero subhead serves this purpose; verify in CI by content-length check).
- [ ] FAQ entries cover 8 of the AI-likely queries in [05-i18n.md](05-i18n.md).

## Accessibility

- [ ] Lighthouse a11y ≥ 95 (covered above).
- [ ] Manual: keyboard-only navigation reaches every interactive element in source order.
- [ ] Manual: NVDA + VoiceOver each announce hero, audience cards, pricing cards, FAQ items correctly.
- [ ] Skip-to-main-content link visible on focus, working.
- [ ] Color contrast verified per [brand/02-color.md](../../brand/02-color.md) for every text-on-background pairing actually used.
- [ ] FAQ accordion: Tab moves between questions, Space/Enter toggles, Up/Down arrows traverse without mouse.
- [ ] All form inputs (waitlist, final CTA worker phone, final CTA employer email) have visible `<label>` and `aria-describedby` for help text.

## Bilingual

- [ ] CI: `check-i18n-parity` passes for `marketing.landing.*` keys.
- [ ] CI: `check-i18n-vars` passes (interpolation variables match between locales).
- [ ] Manual: render every section in EN and ES; assert no English strings on `/es` and no Spanish strings on `/en` (visual review pre-release).
- [ ] Native Mexican-Spanish reviewer signs off on all `marketing.landing.*` ES keys before public launch.

## Privacy

- [ ] Phone numbers entered into the Final CTA worker form are NOT stored if the user abandons before OTP — they exist only in Clerk's signin attempt, not our DB.
- [ ] Waitlist phone numbers are stored only in `waitlist`, never logged in plain text in Sentry breadcrumbs.
- [ ] Impact Numbers tile suppression triggers when count < 25 (verified by integration test).

## Test scenarios

### Unit

1. Locale resolution: `/` → 302 to `/es`; `Accept-Language: en` → 302 to `/en`.
2. `landing.featured_training.spots_left` interpolation: `{ n: 12, capacity: 20 }` → `"12 of 20 spots left"` / `"12 de 20 espacios disponibles"`.
3. Impact suppression: `{ workersPlaced: 18 }` → tile renders "Coming soon" copy, not the number.

### Integration

1. **Featured-jobs read:** seed 5 active job postings → GET `/v1/landing/featured-jobs` returns 4 (top 4 by publishedAt + wageMax).
2. **Featured-jobs RLS:** seed a verified employer's posting in another tenant → not present in default-tenant landing response.
3. **Waitlist happy path:** POST with email → `waitlist` row inserted, email enqueued (verified in `email_log`).
4. **Waitlist rate limit:** 11 POSTs from same IP in one hour → 11th returns 429.
5. **Waitlist suppressed:** suppress an email, then POST → row inserted, no email sent (verified `email_log` empty for that address).
6. **Service-role isolation:** verify `/v1/landing/featured-jobs` cannot return drafts or deleted rows even with crafted parameters.

### E2E (Playwright)

1. Visit `/` from a fresh browser → redirected to `/es` → all 18 sections present, locale toggle visible in nav.
2. Toggle to EN → URL changes to `/en` → all visible copy in English.
3. Final CTA worker form: enter `(559) 555-0100` → submit → routed to Clerk SMS OTP page (or `/coming-soon` v1).
4. Final CTA employer form: enter email → submit → routed to Clerk magic-link confirmation page.
5. FAQ accordion: keyboard open / close 3 questions; assert ARIA attrs and visible state agree.
6. View on iPhone 13 viewport: hero phone mockup shrinks correctly; CTAs full-width; pricing cards stack.

### Manual / visual

1. Visual diff against the Tierra Paper artboard (per section): margins, type sizes, color values match within 2px / one weight step.
2. Print one-page layout (web → PDF) shows hero + first audience card legibly.
3. Test with Slow 4G throttling on Moto G7 emulation: Hero LCP < 2.5s.

## Definition of done

- All v1 functional + non-functional + SEO + a11y + bilingual + privacy criteria pass.
- Lighthouse CI gates green on every landing route.
- Native ES reviewer sign-off on file.
- Visual review against Paper artboard with no open `>2px` discrepancies.
- Sitemap submitted to Google Search Console + Bing Webmaster Tools.
- Production DNS pointed; cert-manager TLS active for `agconn.com` (or replacement domain).
- v2 / v3 acceptance criteria deferred to their respective phase definition-of-done meetings.
