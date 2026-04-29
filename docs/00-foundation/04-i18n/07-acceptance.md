# 04 — i18n: Acceptance Criteria

## Functional

- [ ] Every key in `packages/i18n/en.json` exists in `es.json` and vice versa (CI-gated).
- [ ] Every interpolation variable in EN strings (e.g., `{name}`) appears in the matching ES string (CI-gated).
- [ ] No hardcoded English text in TSX/JSX components in `apps/web/app/[locale]/**` (ESLint rule).
- [ ] Locale toggle persists immediately to `users.preferredLang` and updates Clerk metadata.
- [ ] After locale switch, every subsequent page render is in the new locale (no stale cached strings).
- [ ] Default locale for first visit is ES (verified by E2E with no Clerk session and no `Accept-Language` header).
- [ ] `<html lang>` matches the URL locale on every page.
- [ ] SMS template selection uses `users.preferredLang`, not the locale of the request that triggered it.
- [ ] Email template selection uses `users.preferredLang`.
- [ ] Bilingual DB columns (`title_en`, `title_es`) are both populated for every required field; nullable pairs are all-or-nothing (DB CHECK constraints).

## Non-functional

- [ ] Locale switch is visually applied within 100ms of click (no full-page reload visible to user).
- [ ] `en.json` + `es.json` together < 200 KB after gzip (keeps client bundle reasonable).
- [ ] No hydration mismatch warnings related to locale strings.

## Test scenarios

### Unit

1. `t('worker.onboarding.welcome.tagline')` returns the EN string given `locale='en'` and ES string given `locale='es'`.
2. Missing key falls back to EN, then to the literal key string.
3. Interpolation: `t(locale, 'foo.greeting', { name: 'Maria' })` substitutes correctly in both locales.

### Integration

1. POST `/v1/me/lang { lang: 'en' }` → next `GET /v1/me` returns `preferredLang: 'en'`.
2. SMS sent to a user with `preferredLang: 'es'` arrives with the ES template body.
3. Job posting with `title_es` empty rejected at DB level via CHECK constraint.

### E2E (Playwright)

1. Default landing in ES — visit `/` → redirected to `/es`.
2. Switch to EN at welcome screen — URL becomes `/en/welcome`, content in EN.
3. Sign in, set `preferredLang: en`, sign out, sign back in — landing is `/en`.
4. Worker completes onboarding in ES → welcome SMS received in ES.
5. Worker completes onboarding, switches to EN, applies for job → application status SMS arrives in EN (because they switched mid-flow).

## Definition of done

- CI green on `check-i18n-parity` and `check-i18n-vars`.
- ESLint rule active and passing.
- Native Spanish-speaker review pass complete on the canonical `es.json` keys (or filed corrections).
- Storybook EN+ES variants present for every component in `packages/ui` that renders text.
