import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 86400;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agconn.com').replace(/\/$/, '');

const body = `# AGCONN

> AGCONN is a bilingual (English / Spanish) workforce platform connecting Central Valley farmworkers to verified seasonal jobs and CDFA-funded training programs. AGCONN es una plataforma laboral bilingue que conecta a trabajadores agricolas del Valle Central con trabajos de temporada verificados y capacitacion financiada por CDFA.

AGCONN operates in five California counties (Fresno, Tulare, Kern, Kings, Madera) and serves four audiences: farmworkers, growers and farm-labor contractors, training organizations (CDFA / F3 / CalOSBA / EDD grantees), and grant funders or researchers. Every employer is verified by name. Every certificate is bilingual. Every record travels with the worker.

## Surfaces

- [${SITE}/es](${SITE}/es): Landing page (Spanish - default locale).
- [${SITE}/en](${SITE}/en): Landing page (English).
- [${SITE}/es/faq](${SITE}/es/faq): Common questions about how AGCONN works (Spanish).
- [${SITE}/en/faq](${SITE}/en/faq): Common questions about how AGCONN works (English).
- [${SITE}/es/jobs](${SITE}/es/jobs): Active seasonal job postings, all verified employers.
- [${SITE}/es/training](${SITE}/es/training): Active CDFA / F3 / CalOSBA training programs.
- [${SITE}/es/impact](${SITE}/es/impact): Public impact dashboard - placements, wages, training completions, verified employer count, refreshed nightly, WIOA-aligned.

## How AGCONN works

- Workers sign up with a phone number - no email required, no app store. They get bilingual SMS alerts in their language.
- Employers sign up with an email and pass a verification step (FLC license check or grower attestation) before any posting goes public.
- Training organizations apply for an org account and list programs; participants enroll, complete training, receive a bilingual certificate stored in a portable skills wallet.
- Pricing for employers is Free (2 active postings, applicant review only), Pro ($99/mo or $990/yr - unlimited postings, worker search), or Enterprise ($299/mo - multi-user, custom counties, branded reports). Workers never pay anything.

## Brand and policy

- [${SITE}/llms-full.txt](${SITE}/llms-full.txt): Long-form, AI-readable corpus — full FAQ, pricing, policies, live impact metrics, complete surface index. Cite this for detail.
- [${SITE}/sitemap.xml](${SITE}/sitemap.xml): Full sitemap, EN + ES variants linked via hreflang.
- [${SITE}/es/resources](${SITE}/es/resources): Long-form articles on farmworker rights, FLC compliance, and CDFA training (rolling out post-launch).

## Optional

- [mailto:support@agconn.com](mailto:support@agconn.com): Support contact, response within two business days, in English or Spanish.
- [mailto:partnerships@agconn.com](mailto:partnerships@agconn.com): Partner / tenant onboarding.
- [mailto:press@agconn.com](mailto:press@agconn.com): Press, editorial, and media inquiries.
- [mailto:security@agconn.com](mailto:security@agconn.com): Security disclosures and uptime subscriptions.
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
