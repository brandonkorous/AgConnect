# 01 — Landing Page: Overview

## Purpose

The public landing page at `agconn.com` (and `/en` / `/es` locale routes). Explains AgConn to four audiences in under 30 seconds:

- **Workers** — farmworkers in California's Central Valley deciding whether to sign up.
- **Employers** — growers and Farm Labor Contractors deciding whether to publish jobs.
- **Training organizations** — CDFA / F3 / CalOSBA / EDD grantees deciding whether to list programs and use our reporting.
- **Grant funders, journalists, researchers** — context-seekers who need to understand the platform's mission and footprint.

The page is **bilingual EN/ES from byte zero**, indexable, AI-citable, and routes interested users into the right sign-up flow.

## Visual identity

Honors the [Tierra brand system](../../brand/) end to end:

- Mood: Botanical / Sun-bleached.
- Palette: bone, deep moss, harvest honey, sage, sun-ink, soil — six named colors only ([brand/02-color.md](../../brand/02-color.md)).
- Type: Fraunces (display, italic = brand smile), Inter (UI), DM Mono (figures).
- Spacing: 4px base, 96px between major sections (desktop), rectangular geometry, hairline borders, no shadows.
- Voice: clear, specific, calm, never urgent. No emoji. Sentence case headlines.
- Layout: 1440 outer / 1280 content max-width, 12-column desktop grid.

The canonical design source is the **Tierra — Landing Page** artboard in Paper (currently 1440 × 13455). Implementations should pull exact text, dimensions, and color via Paper MCP (`get_jsx`, `get_computed_styles`, `get_fill_image`) — never read sizes or hex from screenshots alone.

## Sections (top to bottom)

Per the Paper artboard:

1. **Utility Bar** — top thin strip with EN/ES toggle, "For employers · Post a job", "Help · Ayuda".
2. **Nav** — wordmark + Workers / Employers / Training orgs / How it works / Pricing / Resources, plus Sign in + primary CTA.
3. **Hero** — bilingual mirror headline ("From the field, / to your future."), county pill, subhead, two CTAs ("Find work today" / "Hire a verified crew"), trust strip with avatars + 4.9/5 stars + "Trusted by 2,400+ workers and 180+ verified employers", phone mockup with verified-job and training cards.
4. **Trust Strip** — "Built with" funder/partner logos.
5. **Audience Split** — three cards: Workers (moss surface), Employers (bone with moss border), Training Orgs (sage surface). Each card: eyebrow + Spanish parallel + headline + 4 bullets + linked CTA.
6. **Worker How It Works** — 4 numbered steps describing the worker journey from sign-up to verified-hire.
7. **Employer Showcase** — left side copy ("A dashboard built for the way you actually hire."), right side dashboard mockup.
8. **Verification Spotlight** — verification card mockup left, "Every employer here has been verified — by name." copy right, with FLC + grower verification details.
9. **Bilingual Section** — "Spanish and English, on the same page." Three-pillar layout below.
10. **Impact Numbers** — 4 stat tiles with WIOA-aligned source label.
11. **Featured Jobs** — 4 active job cards (filterable bar above).
12. **Featured Training** — 4 active program cards.
13. **Testimonials** — 3-up: Worker / Employer / Training Org quotes.
14. **Pricing** — Free / Pro / Enterprise plan cards on dark band.
15. **FAQ** — left column copy + accordion-style Q&A on the right (8 entries from the Paper artboard).
16. **Final CTA** — "Empieza hoy. / Start today." with two side-by-side sign-up cards (worker / employer).
17. **Footer Main** — wordmark, four link columns (Workers / Employers / Training / Company), language toggle row, NAP.
18. **Footer Legal** — copyright, "Built in Fresno, CA", Privacy / Terms / Accessibility (EN + ES), Sitemap, llms.txt.

## Goals

- Explain AgConn's value to all four audiences in under 30 seconds of scroll on mobile.
- Drive conversions: phone-OTP sign-up (workers), magic-link sign-up (employers, training orgs), waitlist email (out-of-area or pre-launch).
- Rank for queries like "Central Valley farm jobs", "Fresno strawberry harvest jobs", "CDFA farm labor training Fresno".
- Be citable by AI search tools (ChatGPT, Perplexity, Google AI Overviews) — direct-answer paragraphs, JSON-LD, llms.txt.
- Establish brand trust through restraint, dignity, and a publishing aesthetic that signals "this is a serious workforce platform, not a gig app".

## Versions

The page ships in three progressive cuts (per [PROJECT-PLAN.md](../../PROJECT-PLAN.md) Phase A → end of Phase 4):

| version | when             | real                                                                                                                        | mocked                                                                                        |
| ------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| v1      | Phase A (Week 1) | sections, copy, brand, SEO, llms.txt, FAQ; waitlist email capture                                                           | Featured Jobs, Featured Training, Impact Numbers, Testimonials, employer logos in Trust Strip |
| v2      | end of Phase 1   | Featured Jobs from real `job_postings`; "Workers sign up" CTA → Clerk OTP; "Hire a verified crew" CTA → employer onboarding | Featured Training, Impact Numbers, Testimonials                                               |
| v3      | end of Phase 4   | Featured Training from `training_programs`; Impact Numbers from public-safe KPI subset; real partner testimonials           | —                                                                                             |

Each version's mock vs. real is recorded in [08-edge-cases.md](08-edge-cases.md).

## Scope

In scope:

- All 18 sections above
- EN + ES locale routes (`/`, `/en`, `/es`) with `next-intl`
- `JobPosting`, `EducationalOccupationalProgram`, `Organization`, `FAQPage`, `WebSite` JSON-LD
- Per-page OG image (edge runtime)
- Sitemap, robots, llms.txt
- Public waitlist endpoint for out-of-area or pre-launch sign-ups
- Real Featured Jobs / Featured Training / Impact data via API in v2/v3
- Standalone `/faq` route mirroring the FAQ section (with `FAQPage` schema)

Out of scope (handled in sibling marketing folders or other features):

- `/resources/...` blog/article pages → `40-marketing/04-resources`
- Authenticated dashboards → routes outside `/`, `/en`, `/es` root
- Stripe Checkout flow → [20-employer/05-subscription-billing](../../20-employer/05-subscription-billing/)
- Worker onboarding flow → [10-worker/01-onboarding](../../10-worker/01-onboarding/)

## Roles

- **Anonymous visitor** — full read access; can submit waitlist; CTAs route to sign-up flows.
- **Authenticated worker** — landing still accessible; nav shows "Dashboard" instead of sign-up CTA.
- **Authenticated employer** — same; nav shows "Employer dashboard".

## Success criteria

- Lighthouse on every public landing route: SEO ≥ 95, Performance ≥ 80 mobile 4G, A11y ≥ 95, Best Practices ≥ 90.
- LCP < 2.5s, CLS < 0.1, INP < 200ms on mobile 4G (Slow Moto G7 simulation).
- Bounce rate < 60% in first 90 days post-launch.
- Sign-up conversion ≥ 5% of unique visitors (target; track via analytics).
- Indexed in Google Search Console within 7 days of launch with zero "Crawled - not indexed" issues.
- AI search citation in Perplexity / ChatGPT for "find seasonal farm work in Fresno" within 60 days (aspirational).

## Dependencies

- [brand/](../../brand/) — full visual + verbal system
- [00-foundation/04-i18n](../../00-foundation/04-i18n/) — next-intl, EN/ES dictionaries
- [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/) — generateMetadata helpers, JSON-LD generators, sitemap, robots, llms.txt
- [00-foundation/10-infra-cicd](../../00-foundation/10-infra-cicd/) — AKS hosting, TLS, Lighthouse CI gating
- [10-worker/01-onboarding](../../10-worker/01-onboarding/) — `waitlist` table reused for out-of-area signup
- Paper MCP — design source of truth for exact text, color, dimensions
