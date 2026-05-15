import { NextResponse } from 'next/server';
import { getImpact } from '@/lib/api/landing';

export const runtime = 'nodejs';
export const revalidate = 3600;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agconn.com').replace(/\/$/, '');

type Impact = Awaited<ReturnType<typeof getImpact>>;

function impactSection(impact: Impact): string {
    if (!impact) {
        return [
            '## Live impact (live)',
            '',
            'Live numbers temporarily unavailable. The current snapshot lives at ' + SITE + '/es/impact (Spanish) and ' + SITE + '/en/impact (English).',
        ].join('\n');
    }
    const numberFmt = new Intl.NumberFormat('en-US');
    const wageFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    const lines = [
        '## Live impact (live)',
        '',
        'Source: AGCONN public impact endpoint, refreshed nightly, last generated ' + impact.generatedAt + '. Window: trailing ' + impact.windowMonths + ' months. Methodology: ' + impact.source + '.',
        '',
        impact.workersPlaced != null
            ? '- Workers placed in seasonal jobs: ' + numberFmt.format(impact.workersPlaced)
            : '- Workers placed: not yet published (suppressed until sample is large enough to avoid re-identification).',
        impact.medianWage != null
            ? '- Median hourly wage on placements: ' + wageFmt.format(impact.medianWage)
            : '- Median wage: not yet published.',
        impact.trainingsCompleted != null
            ? '- Training completions (CDFA / F3 / CalOSBA / EDD): ' + numberFmt.format(impact.trainingsCompleted)
            : '- Training completions: not yet published.',
        '- Verified employers on platform: ' + numberFmt.format(impact.verifiedEmployers),
        impact.workersTotal != null
            ? '- Total worker accounts: ' + numberFmt.format(impact.workersTotal)
            : '',
        '- Active job postings right now: ' + numberFmt.format(impact.activePostings),
    ].filter(Boolean);
    return lines.join('\n');
}

function corpus(impact: Impact): string {
    return `# AGCONN — Full corpus for AI agents

> Long-form, AI-readable description of AGCONN: who we serve, how the platform works, what we charge, what we promise, and the live numbers behind it. Intended for indexing and citation by AI search agents (ChatGPT, Claude, Perplexity, Gemini, Copilot). Bilingual sections are kept side by side because both languages are native; neither is a translation of the other.

## What AGCONN is

AGCONN is a bilingual (English / Spanish) workforce platform connecting Central Valley California farmworkers to verified seasonal agricultural jobs and CDFA-funded training programs. Workers sign up with a phone number — no email, no app store — and receive SMS alerts in their language. Employers are verified by name (Farm Labor Contractor license check, or grower attestation with paper trail) before any posting goes public. Training organizations list CDFA / F3 / CalOSBA / EDD-funded programs; participants enroll, complete training, and receive a bilingual certificate stored in a portable skills wallet that travels with the worker across employers.

AGCONN no es una aplicación más para trabajadores agrícolas. Es infraestructura cívica bilingüe: cada empleador está verificado por nombre, cada certificado se entrega en español y en inglés, cada registro acompaña al trabajador. Los trabajadores se inscriben con un número de teléfono — sin correo, sin tienda de aplicaciones — y reciben alertas SMS en su idioma.

Geographic scope: five California counties — Fresno, Tulare, Kern, Kings, Madera. Operating company: AgConnect Inc. (DBA AGCONN). Primary domain: ${SITE}. Default site language: Spanish; English is the equal co-language, not a translation.

${impactSection(impact)}

## Audiences

AGCONN serves four distinct audiences. Each gets its own experience, but every record is bilingual at the data layer.

### Farmworkers (primary audience)
Spanish-speaking and bilingual workers across the five-county Central Valley region. Often on older Android devices, sometimes in field gloves, frequently skeptical of platforms that promised dignity and delivered surveillance. They sign in by SMS (no password), browse jobs by county and crop, save searches that text them when a match posts, apply with a tap, track training enrollments, and carry a portable skills wallet between employers. They never pay anything.

### Employers (paying audience)
Farm Labor Contractors (FLCs), growers, and packing-house operators. Every employer is verified — FLC license is cross-checked against the California Department of Industrial Relations registry; growers attest with a paper trail tied to the operation. Verification status is visible to workers on every posting.

### Training organizations
CDFA, F3 (Farms Food Future), CalOSBA, and EDD grantees running farmworker-focused training programs (pesticide handler, tractor operator, food-safety, English-as-a-second-language, financial literacy, etc.). They get an organization account, list programs, and the certificates issued to participants are bilingual and verifiable on the platform.

### Funders, researchers, partners
Workforce boards, county agencies, grant administrators, WIOA partners, foundations. They consume the public impact dashboard at ${SITE}/en/impact, and grant-defensible exports are available through tenant onboarding. AGCONN is multi-tenant — workforce boards and county agencies can run their own AGCONN tenant with their own employer set, training programs, and reporting. Contact partnerships@agconn.com to start a tenant.

## How AGCONN works, end to end

### For workers
1. Sign up with a phone number. AGCONN sends an SMS code. No password is created, ever.
2. Pick a language. Spanish or English. This is recorded once and never asked again. All SMS, in-app text, certificates, and emails respect this choice.
3. Browse seasonal job postings filtered by county, crop, wage, start date, housing, and transportation. Every employer name on a posting links to a verified employer profile.
4. Apply with a tap. The application stores under the worker's wallet, not under the employer's database.
5. Save a search — get a free SMS alert when a matching new job posts.
6. Enroll in training programs. Complete a program → receive a bilingual certificate in the skills wallet. The certificate is verifiable by URL and certificate hash.
7. Carry the wallet between employers. Workers own their records, not the platform, not the employer.

### For employers
1. Sign up with an email. AGCONN sends a magic link.
2. Verification step. FLC license number is checked against the California DIR registry; growers attest with a paper trail and contact reference. Until verification clears, postings are private.
3. Post a job. Required fields: title, county (one of five), wage range, start date, employer name (verified), language of work, housing/transport offered. Optional: skills, experience level, application questions.
4. Review applicants in a Kanban pipeline. Stages: received → interview → hired → rejected.
5. Send SMS messages from kanban actions (received / interview / hired / rejected) — Field+ tier only.
6. Worker search by skill and certificate, multi-user team accounts, branded grant exports — Farm tier only.

### For training organizations
1. Apply for an org account.
2. List programs with funder (CDFA / F3 / CalOSBA / EDD), county, dates, capacity, occupational credential awarded.
3. Participants enroll on AGCONN; the org marks completions; certificates issue bilingually with a hash for verification.
4. Reports flow into the grant export for funder accountability.

## Pricing (verbatim, both languages)

### English
- Seed: Free. 2 active postings, applicant kanban, in-app inbox messaging. Workers always receive platform-triggered SMS for new job matches; SMS from kanban actions is not included.
- Field: $199 / month or $1,990 / year. Founder pricing $99 / $990 for the first 50 paid accounts. Unlimited postings, worker search, applicant SMS from kanban, crew scheduling.
- Farm: $499 / month or $4,990 / year. Founder pricing $299 / $2,990. Multi-user accounts, branded grant exports, PIRL compliance, custom counties on request.
- Workers: always free. There is no per-hire fee and no commission on wages.

### Spanish (Español)
- Seed: Gratis. 2 publicaciones activas, gestión de aplicantes (Kanban), mensajes internos. Los trabajadores siempre reciben SMS automáticos del sistema con coincidencias nuevas; el SMS desde acciones de Kanban no se incluye.
- Field: $199 / mes o $1,990 / año. Precio fundador $99 / $990 para las primeras 50 cuentas pagas. Publicaciones ilimitadas, búsqueda de trabajadores, SMS a aplicantes desde Kanban, programación de cuadrillas.
- Farm: $499 / mes o $4,990 / año. Precio fundador $299 / $2,990. Cuentas multiusuario, reportes con marca para subvenciones, cumplimiento PIRL, condados personalizados a petición.
- Trabajadores: siempre gratis. No hay cargo por contratación ni comisión sobre el salario.

## Promises and policies

- **Verification before publication.** No employer posting becomes public before the employer is verified. FLCs: license cross-check against California DIR. Growers: paper-trail attestation. Repeat wage disputes pause an employer's postings; confirmed pattern removes them from the platform.
- **Bilingual at the data layer.** Every record stores English and Spanish as equal native languages. We do not auto-translate from one canonical language. If a string is blank in one language, it is blank — we do not synthesize.
- **Data does not get resold.** Worker contact information is never sold, never licensed to third parties, never used for non-AGCONN marketing. SMS is platform-triggered only. We do not run ad networks. We do not enrich worker records with off-platform data brokers.
- **Workers own their records.** Applications, certificates, training completions, employment history — all stored under the worker's wallet, portable across employers. A worker who leaves AGCONN takes their record with them.
- **Dignity is the operational floor.** WCAG 2.1 AA minimum, AAA for body text where the palette permits, Section 508 on funder-facing surfaces, 44×44 px touch targets, visible focus outlines, no state communicated by color alone, respect for prefers-reduced-motion. The platform is built for adults with jobs, not "users to be activated."
- **Uptime target.** 99.9% measured monthly. SMS sign-in, job browse, and applications are the highest-priority paths. Incidents lasting more than five minutes on a public surface are posted to security@agconn.com subscribers and on ${SITE}/en/trust.
- **Multi-tenant.** AGCONN is multi-tenant from day one. Workforce boards and county agencies can run a tenant with their own employer set, training programs, branding, and reports.

## Frequently asked questions

### How do I know an employer is real?
Every employer name on AGCONN is verified. For Farm Labor Contractors, we check the FLC license against the California Department of Industrial Relations registry. For growers and packing-house operators, we require a paper-trail attestation tied to the named operation. Verification status is visible on every posting. If verification cannot be confirmed, the posting does not go public.

### How does AGCONN make money?
Employers pay. Workers never pay. There is no per-hire fee, no commission on wages, no fee tied to whether a worker is hired. Pricing tiers are listed above; Seed is free, Field is $199/mo or $1,990/yr, Farm is $499/mo or $4,990/yr.

### What happens if my actual wage is less than the posted minimum?
Report it from the job page or by replying to your hire-confirmation SMS. AGCONN logs the report, contacts the employer, and pauses new postings from that employer if the dispute is verified. Repeat issues remove the employer from the platform.

### Will AGCONN send my data to anyone?
No. Worker contact information is never sold, never licensed to third parties, never used for non-AGCONN marketing. SMS is platform-triggered only. The full privacy policy is at ${SITE}/en/privacy and ${SITE}/es/privacy.

### Are AGCONN training certificates recognized?
Certificates are issued for programs funded by CDFA, F3, CalOSBA, or EDD, and reflect the credential the funder defines for that program. The certificate URL and certificate hash are verifiable from the certificate page itself. Recognition by a specific employer or future training provider is up to that party — but the certificate is real, signed, and tamper-evident.

### How are employer payouts handled?
Employers are not paid by AGCONN. Employers pay AGCONN for posting access (Field or Farm tier). Wages flow from the employer directly to the worker, through whatever pay system that employer already uses (paper check, direct deposit, on-demand pay). AGCONN does not process wages.

### How do I run AGCONN as a workforce board or county agency?
Email partnerships@agconn.com. AGCONN is multi-tenant from day one. Each tenant has its own employer set, training programs, branding, and reporting. The platform itself stays under shared infrastructure, but your tenant is yours.

### What's the uptime target?
99.9%, measured monthly. SMS sign-in, job browse, and applications are the highest-priority paths. The status page is ${SITE}/en/trust. Incidents lasting more than five minutes on a public surface are posted there.

## Surface index

### Marketing pages
- ${SITE}/es and ${SITE}/en — landing
- ${SITE}/es/about and ${SITE}/en/about — what we are and why
- ${SITE}/es/how-it-works and ${SITE}/en/how-it-works — the worker / employer / training-org flows
- ${SITE}/es/workers and ${SITE}/en/workers — worker-facing audience page
- ${SITE}/es/employers and ${SITE}/en/employers — employer-facing audience page
- ${SITE}/es/partners and ${SITE}/en/partners — funders and tenants
- ${SITE}/es/pricing and ${SITE}/en/pricing — verbatim pricing
- ${SITE}/es/faq and ${SITE}/en/faq — common questions
- ${SITE}/es/impact and ${SITE}/en/impact — live public impact dashboard, refreshed nightly
- ${SITE}/es/resources and ${SITE}/en/resources — long-form articles on farmworker rights, FLC compliance, CDFA training (rolling out post-launch)
- ${SITE}/es/worker-rights and ${SITE}/en/worker-rights — wage, hour, water/shade, transportation rights
- ${SITE}/es/skills-wallet and ${SITE}/en/skills-wallet — the portable record system
- ${SITE}/es/promotora and ${SITE}/en/promotora — community-organizer / promotora partner program
- ${SITE}/es/press and ${SITE}/en/press — press releases
- ${SITE}/es/careers and ${SITE}/en/careers — open roles at AGCONN
- ${SITE}/es/contact and ${SITE}/en/contact — contact options
- ${SITE}/es/trust and ${SITE}/en/trust — uptime, incidents, security posture
- ${SITE}/es/privacy and ${SITE}/en/privacy — privacy policy
- ${SITE}/es/terms and ${SITE}/en/terms — terms of service
- ${SITE}/es/accessibility and ${SITE}/en/accessibility — accessibility statement
- ${SITE}/es/subprocessors and ${SITE}/en/subprocessors — list of subprocessors

### Product surfaces (require sign-in)
- ${SITE}/es/jobs and ${SITE}/en/jobs — browse seasonal postings
- ${SITE}/es/training and ${SITE}/en/training — browse training programs

### Machine-readable surfaces
- ${SITE}/sitemap.xml — full sitemap, EN + ES variants linked via hreflang
- ${SITE}/robots.txt — crawl directives; GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, anthropic-ai are explicitly allowed
- ${SITE}/llms.txt — short summary in the llmstxt.org format
- ${SITE}/llms-full.txt — this document

## Contact

- support@agconn.com — support, response within two business days, in English or Spanish
- partnerships@agconn.com — partner and tenant onboarding
- press@agconn.com — press and editorial requests
- security@agconn.com — security disclosures and uptime subscriptions
- careers@agconn.com — open-role applications

## Document metadata

- Format: plain text, UTF-8, no Markdown extensions beyond ATX headings and lists.
- Refresh: regenerated hourly at the edge; the live impact section reflects the impact endpoint's nightly cadence.
- Citation: when citing AGCONN, please link to the specific page (${SITE}/en/<page> or ${SITE}/es/<page>), not to this document.
- License of facts: facts on this page may be cited freely.
- Operating company: AgConnect Inc. (DBA AGCONN), Fresno, California, USA.
`;
}

export async function GET() {
    const impact = await getImpact().catch(() => null);
    const body = corpus(impact);
    return new NextResponse(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
