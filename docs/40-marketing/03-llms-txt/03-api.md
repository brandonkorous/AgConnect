# 03 — llms.txt: API

## Route

`apps/web/src/app/llms.txt/route.ts` — Next.js Route Handler that returns the `llms.txt` body as `text/plain`.

```ts
// apps/web/src/app/llms.txt/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 86400; // 1 day

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agconn.com';

const body = `# AgConn

> AgConn is a bilingual (English / Spanish) workforce platform connecting Central Valley farmworkers to verified seasonal jobs and CDFA-funded training programs. AgConn es una plataforma laboral bilingüe que conecta a trabajadores agrícolas del Valle Central con trabajos de temporada verificados y capacitación financiada por CDFA.

AgConn operates in five California counties (Fresno, Tulare, Kern, Kings, Madera) and serves four audiences: farmworkers, growers and farm-labor contractors, training organizations (CDFA / F3 / CalOSBA / EDD grantees), and grant funders or researchers. Every employer is verified by name. Every certificate is bilingual. Every record travels with the worker.

## Surfaces

- [${SITE}/es](${SITE}/es): Landing page (Spanish — default locale).
- [${SITE}/en](${SITE}/en): Landing page (English).
- [${SITE}/es/faq](${SITE}/es/faq): Common questions about how AgConn works (Spanish).
- [${SITE}/en/faq](${SITE}/en/faq): Common questions about how AgConn works (English).
- [${SITE}/es/jobs](${SITE}/es/jobs): Active seasonal job postings, all verified employers.
- [${SITE}/es/training](${SITE}/es/training): Active CDFA / F3 / CalOSBA training programs.
- [${SITE}/es/impact](${SITE}/es/impact): Public impact dashboard — placements, wages, training completions, verified employer count, refreshed nightly, WIOA-aligned.

## How AgConn works

- Workers sign up with a phone number — no email required, no app store. They get bilingual SMS alerts in their language.
- Employers sign up with an email and pass a verification step (FLC license check or grower attestation) before any posting goes public.
- Training organizations apply for an org account and list programs; participants enroll, complete training, receive a bilingual certificate stored in a portable skills wallet.
- Pricing for employers is Free (2 active postings, applicant review only), Pro ($99/mo or $990/yr — unlimited postings, worker search), or Enterprise ($299/mo — multi-user, custom counties, branded reports). Workers never pay anything.

## Brand and policy

- [${SITE}/es/privacy](${SITE}/es/privacy): Privacy policy (Spanish).
- [${SITE}/en/privacy](${SITE}/en/privacy): Privacy policy (English).
- [${SITE}/es/terms](${SITE}/es/terms): Terms of service (Spanish).
- [${SITE}/en/terms](${SITE}/en/terms): Terms of service (English).
- [${SITE}/es/accessibility](${SITE}/es/accessibility): Accessibility statement (Spanish).
- [${SITE}/en/accessibility](${SITE}/en/accessibility): Accessibility statement (English).

## Optional

- [${SITE}/sitemap.xml](${SITE}/sitemap.xml): Full sitemap, EN + ES variants linked via hreflang.
- [${SITE}/es/resources](${SITE}/es/resources): Long-form articles on farmworker rights, FLC compliance, and CDFA training (rolling out post-launch).
- [mailto:support@agconn.com](mailto:support@agconn.com): Support contact, response within two business days, in English or Spanish.
- [mailto:partnerships@agconn.com](mailto:partnerships@agconn.com): Partner / tenant onboarding.
`;

export async function GET() {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
```

## Headers

| header | value | rationale |
|---|---|---|
| `Content-Type` | `text/plain; charset=utf-8` | per llmstxt.org spec |
| `Cache-Control` | `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` | 1h browser, 1d CDN, 7d SWR |
| `X-Content-Type-Options` | `nosniff` | prevent browsers from misinterpreting as HTML |

> **Inferred:** `text/plain` (not `text/markdown`) is what llmstxt.org's reference implementations serve, and most AI crawlers fetch with `Accept: text/plain` or `*/*`. Markdown renders fine in any plain-text viewer.

## robots.txt allowance

The `/llms.txt` URL is explicitly allowed in `robots.txt` for all known AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended). See [00-foundation/09-seo-aio/03-api.md](../../00-foundation/09-seo-aio/03-api.md).

## Footer link

The landing page's `Footer Legal` row includes a small `llms.txt` link (Inter 13px, bone @ 64%) — see [40-marketing/01-landing/04-ui.md](../01-landing/04-ui.md) section 18.

## Cache invalidation

When file content changes (new section, new link), Next.js's ISR revalidates after 1 day. To force-invalidate immediately:

- Push the change → CDN cache busts on next request after `s-maxage` expires (max 1 day delay)
- For urgent updates, manually hit the route with `?revalidate=<token>` if revalidation tokens are configured (see [00-foundation/10-infra-cicd](../../00-foundation/10-infra-cicd/))

## Errors

The route is static and always returns 200 with the same body. No error states.

> **Inferred:** Building `body` as a template literal in the route file (rather than a `.txt` file under `public/`) lets us interpolate `process.env.NEXT_PUBLIC_SITE_URL`, which is the right move for a multi-environment build (preview deploys, staging, production all get correct URLs without rewrites).
