# 04 — i18n: Edge Cases & Risks

## Translation drift

EN string is updated; ES is forgotten.

**Mitigation:** `check-i18n-parity` catches missing keys but NOT outdated ones. Add a `check-i18n-stale` script that compares git history: if EN was modified more recently than ES for the same key, fail CI. Out of scope for MVP — for MVP, rely on PR review (every PR touching `en.json` must touch `es.json`).

## Hardcoded English in components

Engineer adds a UI string and forgets `t()`. Compiles. Renders English even on `/es/...`.

**Mitigation:** ESLint rule `no-hardcoded-strings` flags any JSX text matching `/[A-Za-z]{4,}/` outside `t()`, `<code>`, or allowlisted positions.

## Untranslated dynamic content

A job posting has `title_en` but `title_es` is empty.

**Mitigation:**

- DB CHECK constraint requires both for required fields.
- Employer create flow validates both at form submit.
- For optional fields, CHECK enforces all-or-nothing.

## Locale URL fork in dev

Engineer runs `pnpm dev`, hits `/`, gets redirected to `/es`, then types `/en/jobs` — works. But search engines see two URLs for the same content.

**Mitigation:**

- `hreflang` tags on every page link to all locale variants.
- Sitemap lists both locales separately.
- Canonical tag points to the same URL (no canonicalization to one locale).
- See [09-seo-aio](../09-seo-aio/) for full SEO hygiene.

## Clerk hosted UI locales

Clerk's hosted SMS-OTP and magic-link pages are configured per Clerk app, not per request. Spanish localization is supported but limited.

**Mitigation:** configure Clerk's default locale to ES; offer a small EN toggle on the welcome page that sets a query param Clerk's hosted UI reads (Clerk supports `lang` query param). Verify all error messages from Clerk render in ES — file Clerk support if not.

## Plurals and gendered language

Spanish has gendered plurals (`bienvenido` vs `bienvenida`) and number agreement. AgConn avoids gendering by default ("Te damos la bienvenida" instead of "Bienvenido/a").

> **Inferred:** Avoiding gendered forms keeps strings simple and inclusive. If users push back, add gender field at signup (out of scope for MVP).

next-intl supports ICU plural rules; use them for any count-based string:

```json
"applications.count": "{count, plural, =0 {No applications} =1 {1 application} other {# applications}}"
```

## Right-to-left

Not supported. Adding RTL would require Tailwind's RTL plugin, layout adjustments, and per-component review. Out of scope for MVP.

## Date/time edge cases

- Quiet hours: 9 PM–7 AM **America/Los_Angeles**, regardless of user locale.
- Date display: `Intl.DateTimeFormat` with the active locale.
- Date input: HTML `<input type="date">` accepts `YYYY-MM-DD` regardless of locale; format the displayed string separately.

## Currency

Always USD. Format with locale: `Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' })`. For Spanish, this produces `US$18.50`; the `US$` prefix is correct and expected.

## Accessibility for screen reader pronunciation

Spanish proper nouns and English brand names mix in the UI. Use `<span lang="en">` to mark English fragments inside Spanish content (e.g., "AgConn" or "F3" in a Spanish sentence) so the screen reader pronounces correctly.

## Encoding

All source files UTF-8 without BOM. Postgres `client_encoding=UTF8`. The Spanish characters `ñ`, `í`, `ú`, `¡`, `¿` round-trip correctly through API and email pipelines — verify with a snapshot test that includes them.

## SMS character budget

Spanish text often exceeds the 160-character GSM-7 budget faster than English (more accents = often UCS-2 = 70 chars/segment).

**Mitigation:**

- Templates designed for ≤ 160 GSM-7 chars (avoid accented chars where possible — "telefono" vs "teléfono" — but only when natural).
- Multi-segment SMS allowed but cost is per-segment; design with that in mind.
- See [05-sms-pipeline/06-messaging.md](../05-sms-pipeline/06-messaging.md) for per-template character budgets.

## Open questions

1. Should employer-facing UI default to EN or ES? Most growers/FLCs in Central Valley speak Spanish but may prefer English business interfaces. Default: EN, with one-tap toggle.
2. For tenant #2, should the platform default locale come from `tenants.settings.defaultLocale`? Yes, but defer until tenant #2 exists.
3. Per-entity bilingual SEO slugs (`seo_slug_en`, `seo_slug_es`) — wait for SEO data before investing.
