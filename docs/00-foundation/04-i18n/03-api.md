# 04 — i18n: API & Server Integration

## Locale resolution chain (server-side)

For any request:

1. **URL prefix** — if the request path starts with `/en/` or `/es/`, that wins.
2. **`users.preferredLang`** — for authenticated requests where URL is locale-agnostic (e.g., `/api/...`).
3. **`Accept-Language` header** — only as a fallback for first-visit unauth users hitting `/`.
4. **Default `es`**.

The chosen locale lives on the Hono context as `c.get('locale')`.

## Hono locale middleware

```ts
// apps/api/src/middleware/locale.ts
export const localeMiddleware = createMiddleware(async (c, next) => {
    const headerLocale = c.req.header('x-locale') as Locale | undefined;
    const userLocale = (c.get('userPreferredLang') ?? null) as Locale | null;
    const accept = parseAcceptLanguage(c.req.header('accept-language'));
    const locale: Locale = headerLocale ?? userLocale ?? accept ?? 'es';
    c.set('locale', locale);
    await next();
});
```

The web app sets `x-locale` on every fetch from the URL prefix so the API doesn't have to re-derive.

## Server-side translation

```ts
// packages/i18n/src/server.ts
import en from './en.json';
import es from './es.json';
const dicts = { en, es } as const;

export function t(locale: Locale, key: TranslationKey, vars?: Record<string, string>) {
    const value = lookup(dicts[locale], key) ?? lookup(dicts.en, key) ?? key;
    return interpolate(value, vars);
}
```

API responses with localized strings (rare — most localization happens on the web client) use this:

```ts
return c.json({
    ok: true,
    message: t(c.get('locale'), 'employer.posting.created'),
});
```

## Web app integration

`next-intl` configured via `apps/web/i18n.ts`:

```ts
// apps/web/i18n.ts
import { getRequestConfig } from 'next-intl/server';
import en from '@agconn/i18n/en.json';
import es from '@agconn/i18n/es.json';

export default getRequestConfig(async ({ locale }) => ({
    messages: locale === 'en' ? en : es,
}));
```

`apps/web/middleware.ts` chains `next-intl` middleware with Clerk:

```ts
import createIntlMiddleware from 'next-intl/middleware';
import { clerkMiddleware } from '@clerk/nextjs/server';

const intl = createIntlMiddleware({
    locales: ['en', 'es'],
    defaultLocale: 'es',
    localePrefix: 'always', // both /en and /es are explicit; no bare /
});

export default clerkMiddleware((auth, req) => intl(req));
```

In RSC and client components:

```tsx
import { useTranslations } from 'next-intl';
const t = useTranslations('worker.onboarding.welcome');
return <h1>{t('tagline')}</h1>;
```

## Locale-prefixed URLs

Every route under `apps/web/app/[locale]/...`. Locales: `en`, `es`. URLs:

- `/en/jobs/...` and `/es/trabajos/...` — for SEO, the `/es` slug is **hand-localized** for top-level routes (jobs → trabajos, training → capacitacion). For dynamic routes (`/jobs/[slug]`), the slug stays English-only in MVP unless the entity has a separate `seo_slug_es` (out of scope for MVP).

> **Inferred:** Hand-localized top-level slugs are a minimal SEO win. Per-entity bilingual slugs (separate `seo_slug_en` and `seo_slug_es`) double the SEO surface but require employer effort. Defer to a partner conversation.

## LangToggle behavior

```tsx
// packages/ui/src/LangToggle.tsx
'use client';
export function LangToggle() {
    const router = useRouter();
    const locale = useLocale();
    const pathname = usePathname();

    const switchTo = async (next: Locale) => {
        if (next === locale) return;

        // 1. Persist to user.preferredLang (no-op if unauthenticated)
        await fetch('/api/v1/me/lang', {
            method: 'POST',
            body: JSON.stringify({ lang: next }),
            headers: { 'content-type': 'application/json' },
        }).catch(() => {});

        // 2. Replace the locale segment in the current URL
        const newPath = pathname.replace(/^\/(en|es)/, `/${next}`);
        router.replace(newPath);
    };

    return (
        <div className='join'>
            <button onClick={() => switchTo('es')} className={`btn join-item ${locale === 'es' ? 'btn-active' : ''}`}>
                ES
            </button>
            <button onClick={() => switchTo('en')} className={`btn join-item ${locale === 'en' ? 'btn-active' : ''}`}>
                EN
            </button>
        </div>
    );
}
```

## SMS / email locale selection

Workers and worker-facing email/SMS templates pick by `users.preferredLang`. Employer-facing templates default to EN unless the employer's `preferredLang` is set to ES.

See [05-sms-pipeline/03-api.md](../05-sms-pipeline/03-api.md) and [06-email-pipeline/03-api.md](../06-email-pipeline/03-api.md).

## CI checks

- `check-i18n-parity` — every key in `en.json` exists in `es.json` and vice versa.
- `check-i18n-vars` — interpolation variable names match between EN and ES.
- ESLint `agconn/no-hardcoded-strings` — JSX text nodes containing `[A-Za-z]{4,}` outside `t()` calls fail the lint step.
