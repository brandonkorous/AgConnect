# 04 — i18n: Overview

## Purpose

AgConn is bilingual EN/ES from day one — not as a translation layer over English, but as a first-class architectural constraint. Every UI string, SMS, email, certificate, and validation error exists in both languages before a feature ships. This is recorded in the kickoff §7.

## Stack

- **next-intl 4.11.0** — App Router-native i18n with locale-prefixed routes (`/en/...`, `/es/...`).
- **Prisma `_en` / `_es` paired columns** for stored content (job postings, training programs).
- **Twilio bilingual SMS templates** keyed by `users.preferredLang`.
- **React Email components** with locale prop.
- **Zod with i18n message keys** for validation errors.

## Rules

1. **No string ships without both languages.** Linter rules + CI checks enforce this. See [07-acceptance.md](07-acceptance.md).
2. **`preferredLang` on `users` is the source of truth.** Not the browser locale. The locale-prefixed URL reflects it.
3. **All bilingual content stored as paired columns**, never as a single translated blob.
4. **SMS and email pick template by `preferredLang`** at send time, even if the user is currently using the other language in-app.
5. **Spanish first.** ES is the default for new users. The welcome screen toggle reverses to EN if needed. The default redirect is `/` → `/es`.

> **Inferred:** Spanish-first is appropriate for the Central Valley farmworker user base. For a future tenant whose users skew English-first, the default locale should be tenant-configurable via `tenants.settings.defaultLocale`. Out of scope for MVP.

## What's bilingual

| surface                                 | mechanism                                           |
| --------------------------------------- | --------------------------------------------------- |
| UI strings                              | `packages/i18n/{en,es}.json` consumed via next-intl |
| Database content (titles, descriptions) | `_en` / `_es` paired columns                        |
| SMS messages                            | bilingual templates in `packages/sms/templates`     |
| Emails                                  | React Email components with `locale` prop           |
| Certificates                            | bilingual PDF (EN header, ES body, or two-column)   |
| Validation errors                       | Zod messages keyed; resolver injects locale         |
| URLs                                    | locale-prefixed: `/en/jobs/...`, `/es/trabajos/...` |
| OG images                               | per-locale variants                                 |
| robots.txt / sitemap                    | both locales indexed via `hreflang`                 |

## What's NOT bilingual (MVP)

- Admin dashboard — internal tool, English only.
- Console error logs.
- API error codes themselves (the human messages are bilingual; the codes are stable English keys like `phone_already_registered`).
- Code comments.

## Scope

In scope:

- next-intl 4 setup with App Router
- `packages/i18n` package with `en.json` + `es.json`
- Locale resolution: URL → user.preferredLang → default
- LangToggle UI component (in `packages/ui`)
- Zod resolver that maps message keys to localized strings
- CI script `check-i18n-parity` ensuring every key exists in both files
- ESLint rule `no-hardcoded-strings` blocking literal text outside `t()` calls

Out of scope:

- Translation memory tooling (no Crowdin / Lokalise integration in MVP)
- Right-to-left languages
- Pluralization beyond English/Spanish (next-intl supports it; we just don't have the cases)

## Success criteria

- 100% of user-facing strings are translated to ES (CI gates).
- Switching language via `LangToggle` reflects within 100ms.
- The `/es` URL space is fully crawlable and indexed.
- No EN string ever appears on a `/es/...` page (manually verified per release).

## Dependencies

None upstream. Many features depend on this:

- All worker and employer features
- [05-sms-pipeline](../05-sms-pipeline/) — SMS template selection
- [06-email-pipeline](../06-email-pipeline/) — email template selection
- [09-seo-aio](../09-seo-aio/) — `hreflang` and locale-aware sitemap
