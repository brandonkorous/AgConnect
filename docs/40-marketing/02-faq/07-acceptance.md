# 02 — FAQ: Acceptance Criteria

## Functional

- [ ] `/[locale]/faq` route renders for `locale` in `{en, es}` and 404s for any other.
- [ ] Page renders all 8 landing-shared FAQ entries plus 4–6 extras.
- [ ] Extras visually separated from the shared entries by hairline + `More detail` / `Más detalle` label.
- [ ] All entries collapsed by default on `/faq` (different from landing where the first 2 are open).
- [ ] Anchor link `#<entry-id>` opens that entry and smooth-scrolls it into view on page load.
- [ ] "Email support@agconn.com" link uses `mailto:` and includes a default subject line referring to FAQ context.
- [ ] "Back to home" link routes to `/[locale]`.

## SEO / AIO

- [ ] `FAQPage` JSON-LD includes every visible Q&A — validates against [validator.schema.org](https://validator.schema.org/).
- [ ] `Organization` JSON-LD also present (inherited via marketing layout).
- [ ] Metadata: title ≤ 60 chars, description ≤ 160 chars, canonical, hreflang en/es/x-default.
- [ ] OG image references `/og/landing?locale=<locale>` and renders correctly.
- [ ] Sitemap lists `/en/faq` and `/es/faq` with `priority: 0.8` and `changeFrequency: weekly`.
- [ ] `<h1>` is the page headline; question buttons are `<h3>` (or `<summary>` inside `<h3>`).
- [ ] Direct-answer paragraphs in the first 200 words: page intro + first FAQ answer.

## Accessibility

- [ ] Lighthouse a11y ≥ 95.
- [ ] Keyboard-only: Tab moves between question buttons; Space/Enter toggles; Up/Down arrows navigate between buttons.
- [ ] Screen-reader: each question announces its open/closed state (via `<details>` `aria-expanded`).
- [ ] Visible focus on every interactive element; 2px honey outline on bone.
- [ ] Color contrast ≥ 7:1 for question text, ≥ 4.5:1 for answer text.
- [ ] No-JS fallback: every question is open by default; native `<details>` keyboard behavior works.

## Bilingual

- [ ] CI: `check-i18n-parity` passes for `marketing.faq_page.*` and `marketing.faq_extras.*` keys.
- [ ] Render every entry in EN and ES; assert no English on `/es/faq` and no Spanish on `/en/faq`.
- [ ] Native Mexican-Spanish reviewer signs off on all ES copy before launch.

## Performance

- [ ] Lighthouse mobile (Slow 4G, Moto G7): SEO ≥ 95, Performance ≥ 90, A11y ≥ 95.
- [ ] LCP < 1.5s, CLS < 0.1, INP < 200ms.
- [ ] Client JS budget < 5 KB gzipped.

## Test scenarios

### Unit

1. `<FaqAccordion variant="standalone" initialOpen={[]}>` renders with all items closed.
2. Anchor effect: with `window.location.hash = '#flc-verification'`, the matching entry opens after mount.
3. JSON-LD generator: `faqPageJsonLd({ entries, locale: 'es' })` produces `inLanguage: 'es-MX'` and a `Question`/`Answer` pair per entry.

### E2E (Playwright)

1. Visit `/es/faq` → all 8 + extras visible, all collapsed; click first question → expands; click again → collapses.
2. Toggle to EN: `/en/faq` → page reloads in English; all entries collapsed.
3. Visit `/en/faq#skills-wallet` → that entry is open + scrolled into view.
4. Tab through the page → focus order is: utility bar links → nav links → first question button → second question button → … → still-questions email link → footer.
5. Disable JS → every question's answer is visible; clicking a question hides/shows it via native `<details>`.

### Manual

1. Validate JSON-LD using [validator.schema.org](https://validator.schema.org/) on staging URL.
2. Test on iPhone 13 viewport: Fraunces headline scales to 48px; 16px page padding sides.
3. Test screen reader (NVDA on Windows, VoiceOver on macOS): question button announces "Collapsed, button" or "Expanded, button"; arrow keys move focus.

## Definition of done

- All functional + SEO + a11y + bilingual + performance criteria pass.
- Lighthouse CI gates green on `/en/faq` and `/es/faq`.
- Native ES reviewer sign-off on file.
- Sitemap entries verified in production sitemap.xml.
- JSON-LD validates clean.
