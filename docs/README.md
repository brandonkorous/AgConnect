# AgConn Documentation

Source: [AgConn-Architecture-Kickoff.docx](AgConn-Architecture-Kickoff.docx)

This directory contains complete, implementation-ready specifications for every AgConn feature, organized by domain. Each feature folder is **self-contained** — you should not need to re-read the kickoff document to implement it.

## Conventions

- Folders are numbered by domain and ordered roughly by dependency / build order.
- Within a feature folder, files are split by concern (`01-overview.md`, `02-data-model.md`, etc.) so context stays focused — open only the file that matches what you're working on.
- Decisions inferred beyond what the kickoff specifies are marked with `> **Inferred:**` callouts. Override these freely; they are starting drafts, not contracts.

## Index by domain

### Brand

- [brand](brand/) — Tierra brand system: color, typography, spacing, voice, components, imagery, accessibility

### 00 — Foundation (cross-cutting systems consumed by every feature)

- [01-multi-tenancy](00-foundation/01-multi-tenancy/) — tenant resolution, FK pattern, RLS
- [02-auth](00-foundation/02-auth/) — Clerk integration (SMS OTP + magic link)
- [03-database](00-foundation/03-database/) — Prisma schema, migrations, RLS policy template
- [04-i18n](00-foundation/04-i18n/) — next-intl setup, EN/ES bilingual rules
- [05-sms-pipeline](00-foundation/05-sms-pipeline/) — Twilio + pg-boss + quiet hours
- [06-email-pipeline](00-foundation/06-email-pipeline/) — Resend + React Email templates
- [07-resume-parser](00-foundation/07-resume-parser/) — Claude API resume parser → ResumeSchema
- [08-certificate-generation](00-foundation/08-certificate-generation/) — React-PDF bilingual certs
- [09-seo-aio](00-foundation/09-seo-aio/) — metadata, JSON-LD, sitemap, llms.txt
- [10-infra-cicd](00-foundation/10-infra-cicd/) — AKS, GHCR, GitHub Actions, environments
- [11-app-shell](00-foundation/11-app-shell/) — UX primitives (toast, modal, form, error boundary), API error envelope, PWA wrapper
- [12-audit-log](00-foundation/12-audit-log/) — append-only event log, action taxonomy, retention, admin viewer

### 10 — Worker features

- [01-onboarding](10-worker/01-onboarding/) — SMS OTP → resume upload → profile review
- [02-resume-editor](10-worker/02-resume-editor/) — inline edit of structured resume JSON
- [03-job-discovery](10-worker/03-job-discovery/) — search, filter, save, alert
- [04-application-tracker](10-worker/04-application-tracker/) — apply, status, notifications
- [05-training-browser](10-worker/05-training-browser/) — browse, enroll, reminders
- [06-skills-wallet](10-worker/06-skills-wallet/) — earned certs, share, download

### 20 — Employer features

- [01-flc-verification](20-employer/01-flc-verification/) — license entry + admin verification
- [02-job-postings](20-employer/02-job-postings/) — bilingual posting CRUD
- [03-applicant-review](20-employer/03-applicant-review/) — Kanban pipeline + hire flow
- [04-worker-search](20-employer/04-worker-search/) — Pro+ vetted pool search
- [05-subscription-billing](20-employer/05-subscription-billing/) — Stripe Checkout + portal

### 30 — Admin features

- [01-kpi-dashboard](30-admin/01-kpi-dashboard/) — live tiles
- [02-placement-report](30-admin/02-placement-report/) — WIOA-aligned CSV/XLSX
- [03-training-report](30-admin/03-training-report/) — completions by program/funder/org
- [04-employer-activity](30-admin/04-employer-activity/) — postings, hire rates, by county

### 40 — Marketing

- [01-landing](40-marketing/01-landing/) — public bilingual landing page (sections, copy, SEO, waitlist)
- [02-faq](40-marketing/02-faq/) — standalone `/[locale]/faq` route with `FAQPage` JSON-LD
- [03-llms-txt](40-marketing/03-llms-txt/) — `/llms.txt` AIO discoverability surface
- [04-resources](40-marketing/04-resources/) — long-form bilingual articles under `/[locale]/resources/...` (v1 empty-state, v2 article system)

## Project plan

- [PROJECT-PLAN.md](PROJECT-PLAN.md) — phased build order, dependencies, decisions, definition of done

## Index by phase (build order from kickoff §16 + landing-page parallel track)

- **Phase A — Marketing v1 (Week 1, parallel with Phase 0):** [40-marketing/01-landing](40-marketing/01-landing/) — static bilingual landing page, waitlist capture, sitemap, llms.txt
- **Phase 0 — Foundation (Week 1):** [01-multi-tenancy](00-foundation/01-multi-tenancy/), [02-auth](00-foundation/02-auth/), [03-database](00-foundation/03-database/), [04-i18n](00-foundation/04-i18n/), [10-infra-cicd](00-foundation/10-infra-cicd/), [11-app-shell](00-foundation/11-app-shell/), [12-audit-log](00-foundation/12-audit-log/)
- **Phase 1 — Worker Core (Weeks 2–3):** [10-worker/01-onboarding](10-worker/01-onboarding/), [10-worker/02-resume-editor](10-worker/02-resume-editor/), [10-worker/03-job-discovery](10-worker/03-job-discovery/), [10-worker/04-application-tracker](10-worker/04-application-tracker/), [20-employer/02-job-postings](20-employer/02-job-postings/), [00-foundation/05-sms-pipeline](00-foundation/05-sms-pipeline/), [00-foundation/07-resume-parser](00-foundation/07-resume-parser/)
- **Phase 2 — Employer Core (Week 4):** [20-employer/01-flc-verification](20-employer/01-flc-verification/), [20-employer/03-applicant-review](20-employer/03-applicant-review/), [20-employer/04-worker-search](20-employer/04-worker-search/), [20-employer/05-subscription-billing](20-employer/05-subscription-billing/), [00-foundation/06-email-pipeline](00-foundation/06-email-pipeline/)
- **Phase 3 — Training & Certificates (Week 5):** [10-worker/05-training-browser](10-worker/05-training-browser/), [10-worker/06-skills-wallet](10-worker/06-skills-wallet/), [00-foundation/08-certificate-generation](00-foundation/08-certificate-generation/)
- **Phase 4 — Grant Reporting (Week 6):** [30-admin/01-kpi-dashboard](30-admin/01-kpi-dashboard/), [30-admin/02-placement-report](30-admin/02-placement-report/), [30-admin/03-training-report](30-admin/03-training-report/), [30-admin/04-employer-activity](30-admin/04-employer-activity/)
- **Phase 5 — SEO, AIO & Polish (Week 7):** [00-foundation/09-seo-aio](00-foundation/09-seo-aio/) (final pass across all public surfaces)

## File naming inside each feature folder

Each feature folder uses the following file split. Files only exist if the concern applies (e.g., a backend-only feature won't have `04-ui.md`).

| file               | content                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `01-overview.md`   | purpose, scope, users, success criteria, dependencies                    |
| `02-data-model.md` | Prisma models, JSONB shapes, RLS policies, indexes, seed data            |
| `03-api.md`        | Hono endpoints, Zod request/response schemas, error codes                |
| `04-ui.md`         | routes, screens, states, accessibility, mobile/PWA notes                 |
| `05-i18n.md`       | EN/ES copy strings under feature namespace                               |
| `06-messaging.md`  | SMS + email templates triggered by this feature                          |
| `07-acceptance.md` | functional, non-functional, edge-case checklists; test scenarios         |
| `08-edge-cases.md` | failure modes, security considerations, compliance notes, open questions |
