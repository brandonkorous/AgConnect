# AGCONN — Project Plan

A phased build plan for AGCONN (Tierra brand). This plan ties the [feature spec folders](README.md) and the [Tierra brand system](brand/) to a sequence of concrete deliverables, milestones, and decisions.

**How to read this plan**

- Each phase has a goal, the feature folders it ships, and a definition of done.
- The plan acknowledges that some features (landing page, foundation, billing) progress in stages — we ship a v1 early and harden later.
- Decisions and action items that block progress are called out at the bottom.
- Dates are relative ("Week N") because the start date depends on team size and a couple of unblocked decisions (domain name, A2P 10DLC, partner intros).
- `> **Inferred:**` callouts mark assumptions you can override.

> **Inferred:** Plan assumes a lean team (1–2 full-stack engineers + a designer, plus part-time admin/legal/partner work). At larger team sizes, some phases compress because tracks parallelize further.

## Status snapshot — 2026-04-29

| area                   | status                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| Architecture decisions | Locked (kickoff v0.2, ADR-001..005)                               |
| Brand system           | Locked except logo (`brand/09-logo.md` pending)                   |
| Feature specs          | 24 features fully specced under [docs/](README.md)                |
| Landing-page design    | Locked in Paper (`Tierra — Landing Page` artboard)                |
| Code                   | None yet                                                          |
| Infra                  | Not provisioned                                                   |
| External accounts      | Not provisioned (Stripe, Twilio, Clerk, Resend, Anthropic, Azure) |
| Partners               | Not engaged (CDFA / EDD / FLC reviewer / native ES reviewer)      |

## Domain map (build units)

The build units come from the existing feature folders plus one new domain (`40-marketing`) that didn't exist when the original 24-feature spec was written. The kickoff phases use this map.

| domain                   | feature folders                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **00 foundation**        | [01-multi-tenancy](00-foundation/01-multi-tenancy/), [02-auth](00-foundation/02-auth/), [03-database](00-foundation/03-database/), [04-i18n](00-foundation/04-i18n/), [05-sms-pipeline](00-foundation/05-sms-pipeline/), [06-email-pipeline](00-foundation/06-email-pipeline/), [07-resume-parser](00-foundation/07-resume-parser/), [08-certificate-generation](00-foundation/08-certificate-generation/), [09-seo-aio](00-foundation/09-seo-aio/), [10-infra-cicd](00-foundation/10-infra-cicd/) |
| **10 worker**            | [01-onboarding](10-worker/01-onboarding/), [02-resume-editor](10-worker/02-resume-editor/), [03-job-discovery](10-worker/03-job-discovery/), [04-application-tracker](10-worker/04-application-tracker/), [05-training-browser](10-worker/05-training-browser/), [06-skills-wallet](10-worker/06-skills-wallet/)                                                                                                                                                                                   |
| **20 employer**          | [01-flc-verification](20-employer/01-flc-verification/), [02-job-postings](20-employer/02-job-postings/), [03-applicant-review](20-employer/03-applicant-review/), [04-worker-search](20-employer/04-worker-search/), [05-subscription-billing](20-employer/05-subscription-billing/)                                                                                                                                                                                                              |
| **30 admin**             | [01-kpi-dashboard](30-admin/01-kpi-dashboard/), [02-placement-report](30-admin/02-placement-report/), [03-training-report](30-admin/03-training-report/), [04-employer-activity](30-admin/04-employer-activity/)                                                                                                                                                                                                                                                                                   |
| **40 marketing** _(new)_ | `01-landing` (this session), `02-faq`, `03-llms-txt`, `04-resources`                                                                                                                                                                                                                                                                                                                                                                                                                               |

Add a "40 — Marketing" section to [README.md](README.md) once the new folder lands.

## Phases

The kickoff (§16) defines six phases. This plan reorganizes them slightly to make the **landing page the first shippable artifact**, in parallel with foundation work, so AGCONN can collect waitlist interest and partner intros while engineers are wiring up Clerk and Postgres.

### Phase A — Marketing v1 (Week 1, parallel with Phase 0)

**Goal:** ship a static, bilingual, indexable landing page at `agconn.com` (or replacement domain) that explains AGCONN to workers, employers, training orgs, and grant funders. No real authentication, no real data — but live and crawlable.

**Builds:**

- `40-marketing/01-landing` — sections per the Paper artboard: Utility Bar, Nav, Hero, Trust Strip, Audience Split, Worker How It Works, Employer Showcase, Verification Spotlight, Bilingual Section, Impact Numbers (placeholder values clearly labeled), Featured Jobs (placeholder mocks), Featured Training (placeholder mocks), Testimonials, Pricing, FAQ, Final CTA, Footer Main, Footer Legal.
- `40-marketing/02-faq` — same content as the FAQ section embedded on landing, plus a standalone `/faq` route with `FAQPage` JSON-LD.
- `40-marketing/03-llms-txt` — `/llms.txt` per [00-foundation/09-seo-aio](00-foundation/09-seo-aio/).
- Static EN + ES routes (`/`, `/en`, `/es`) using next-intl.
- Sign-up CTAs route to `/coming-soon` until auth ships (Phase 0 close).
- Waitlist capture (email-only) wired to a single tenant-less `waitlist` row.

**Definition of done:**

- All sections from the Paper artboard rendered to the brand spec.
- Lighthouse: SEO ≥ 95, Performance ≥ 80 mobile 4G, A11y ≥ 95, Best Practices ≥ 90.
- `JobPosting` / `EducationalOccupationalProgram` / `Organization` / `FAQPage` JSON-LD present and valid.
- Sitemap + robots + llms.txt live.
- Hosted on AKS preview (or an interim Azure Static Web App) with TLS.
- DNS pointed at production.

> **Inferred:** Hosting Phase A on Azure Static Web App (or Vercel free tier) is acceptable as a temporary measure if AKS isn't provisioned in time. Migrate to AKS during Phase 0 close.

### Phase 0 — Foundation (Week 1)

**Goal:** the cross-cutting machinery every feature depends on.

**Builds:**

- [00-foundation/01-multi-tenancy](00-foundation/01-multi-tenancy/) — `tenants` table, RLS policy template, tenant-resolution middleware
- [00-foundation/03-database](00-foundation/03-database/) — Prisma schema for `tenants`, `users`, `auth_events`, `audit_events`, `migration_log`; seeds; CI checks (`check-tenant-id`, `check-rls`)
- [00-foundation/02-auth](00-foundation/02-auth/) — Clerk SMS OTP (workers) + magic link (employers, training orgs, admin); webhook → `users` sync
- [00-foundation/04-i18n](00-foundation/04-i18n/) — next-intl, `packages/i18n` with `en.json` / `es.json`, locale toggle, CI parity check
- [00-foundation/10-infra-cicd](00-foundation/10-infra-cicd/) — AKS namespace, GHCR push, `deploy.yml`, preview environments, Key Vault + CSI
- [00-foundation/11-app-shell](00-foundation/11-app-shell/) — `packages/ui` primitives (toast, modal, form, skeleton, empty-state, error boundary), `packages/api-client` with error envelope, PWA wrapper on **serwist** (manifest, SW, install prompt, offline fallback). Mutations are write-through for MVP; queue-and-replay is a post-launch upgrade path.
- [00-foundation/12-audit-log](00-foundation/12-audit-log/) — `audit_events` table with append-only RLS + monthly partitioning + per-row HMAC tamper-evidence, `packages/audit` with action registry + ESLint rule, audit middleware with default-on circuit breaker, retention worker, nightly HMAC verifier, bilingual-by-design admin viewer (English-rendered for MVP, ES key shape mirrored)

**Parallel track (starts mid-week):**

- [00-foundation/05-sms-pipeline](00-foundation/05-sms-pipeline/) — Twilio integration, A2P 10DLC registration submitted (carrier review takes 1–4 weeks; **start now**)
- [00-foundation/06-email-pipeline](00-foundation/06-email-pipeline/) — Resend domain verification, SPF/DKIM/DMARC

**Definition of done:**

- Clerk SMS OTP and magic-link auth round-trip in dev + preview env, with `auth.login` / `auth.logout` audit events recorded.
- Every Prisma model conforms to convention checks (`check-tenant-id`, `check-rls`, audit-required ESLint rule).
- `/v1/me/tenant` returns the resolving tenant; cross-tenant request rejected; the rejection itself is audited.
- A2P 10DLC application submitted (approval expected during Phase 1–2).
- DNS records for `agconn.com` and `mail.agconn.com` verified.
- Worker dashboard route passes Lighthouse PWA category (installable, offline fallback, manifest valid) on a Pixel-class device over throttled 4G, served via serwist.
- Every API endpoint emits the error envelope; an integration test asserts the contract.
- Admin viewer at `/admin/audit` lists seeded events with working filters; every visible string reads from `messages/{en,es}.json` with the parity-check allowlist permitting empty ES values during MVP.
- HMAC tamper-evidence proven end to end: forge a row in dev → `?verify=true` returns `verified: false`; nightly verifier emits `system.audit.tamper_detected` and pages.
- Audit circuit breaker proven end to end: forced consecutive write failures open the breaker; business requests succeed; recovery drains the queue and emits `system.audit.breaker.recovered`.
- Azure Key Vault holds `audit-hmac-key/v1`; app boot fails loudly without it.

### Phase 1 — Worker Core (Weeks 2–3)

**Goal:** a worker can sign up, build a profile, find jobs, and apply, end to end in either language.

**Builds:**

- [00-foundation/07-resume-parser](00-foundation/07-resume-parser/) — Anthropic-backed parser, eval set
- [10-worker/01-onboarding](10-worker/01-onboarding/) — phone OTP → resume upload → review → county → skills → availability → complete
- [10-worker/02-resume-editor](10-worker/02-resume-editor/) — inline edit of structured resume JSON
- [10-worker/03-job-discovery](10-worker/03-job-discovery/) — listing, filters, FTS, saved searches, alert dispatcher cron
- [10-worker/04-application-tracker](10-worker/04-application-tracker/) — apply / withdraw / status; SMS + email notifications

**Bridge to employers** (so workers have something to apply to):

- [20-employer/02-job-postings](20-employer/02-job-postings/) — minimal create-edit-publish flow, gated by manual admin "verified" flag (FLC verification UI ships in Phase 2)
- A bare-bones admin tool to mark an employer verified (script or single admin endpoint — sufficient until [01-flc-verification](20-employer/01-flc-verification/) UI ships)

**Definition of done:**

- A test worker (real phone, real PDF resume) completes onboarding in ES end to end and receives the welcome SMS in ES.
- The worker can find an active posting (seeded by an admin), apply, and receive an `application.applied` SMS.
- Saved-search dispatcher fires SMS within 5 minutes of a matching job (excluding quiet hours).
- A2P 10DLC approved (or a fallback short code in place).
- Resume parser eval ≥ 90% schema-valid on the 50-resume eval set.

### Phase 2 — Employer Core (Week 4)

**Goal:** employers can self-serve onboard, get verified, post jobs, review applicants, and pay.

**Builds:**

- [20-employer/01-flc-verification](20-employer/01-flc-verification/) — license entry, admin verification queue, employer email notifications
- [20-employer/03-applicant-review](20-employer/03-applicant-review/) — Kanban (Applied / Reviewed / Hired), bulk reject, hire flow with wage capture
- [20-employer/05-subscription-billing](20-employer/05-subscription-billing/) — Stripe Checkout + Customer Portal, webhook sync, plan-tier feature gates
- [20-employer/04-worker-search](20-employer/04-worker-search/) — Pro+ vetted search, redacted preview, invite-to-apply

**Definition of done:**

- A test employer signs up, gets verified within 1 business day, publishes a posting, receives applicants, hires one with wage capture.
- Stripe Checkout + Portal round-trip in test mode; plan downgrade syncs to DB within 5 seconds.
- Free-plan posting cap enforced atomically.
- Worker search redacts contact info; invite-to-apply produces an `applications` row on accept.

### Phase 3 — Training & Certificates (Week 5)

**Goal:** training orgs can run programs; workers earn portable, verifiable certs.

**Builds:**

- [10-worker/05-training-browser](10-worker/05-training-browser/) — program browse, enrollment, reminder cron, org dashboard, roster/marking
- [00-foundation/08-certificate-generation](00-foundation/08-certificate-generation/) — React-PDF bilingual cert, Supabase Storage, signed-URL delivery
- [10-worker/06-skills-wallet](10-worker/06-skills-wallet/) — wallet view, share menu

**Definition of done:**

- A worker enrolls, attends (org marks completed), gets a cert SMS + email with PDF attached.
- 48h and 2h reminders fire via dispatcher (bypassing quiet hours per spec).
- Visual snapshot test of cert PDF passes; PDF renders identically in Adobe / Preview / Chrome / mobile Gmail preview.
- Wallet shows AGCONN-verified vs. self-reported certs distinctly.

### Phase 4 — Grant Reporting (Week 6)

**Goal:** admin can produce WIOA-aligned exports for grantees.

**Builds:**

- [30-admin/01-kpi-dashboard](30-admin/01-kpi-dashboard/) — live tiles, time + county filters
- [30-admin/02-placement-report](30-admin/02-placement-report/) — per-row CSV/XLSX with WIOA fields, anonymized participant IDs
- [30-admin/03-training-report](30-admin/03-training-report/) — per-enrollment + aggregate views
- [30-admin/04-employer-activity](30-admin/04-employer-activity/) — per-employer rollups, drill-down

**Definition of done:**

- Numbers reconcile across KPI tiles and detail reports.
- Action item from kickoff §11.1 complete: a CDFA / EDD contact has reviewed a sample CSV and signed off on field labels.
- Audit log (`report_runs`) populated on every export.

### Phase 5 — SEO/AIO Polish, Hardening & Launch (Week 7)

**Goal:** launch readiness.

**Builds:**

- [00-foundation/09-seo-aio](00-foundation/09-seo-aio/) — final pass: every public page has `generateMetadata` + JSON-LD, OG images per entity, hreflang, sitemap completeness, llms.txt up to date, Lighthouse CI gating
- `40-marketing/01-landing` v3 — wire real Featured Jobs / Featured Training / Impact Numbers from the API once enough live data exists
- Penetration test pass (RLS bypass attempts, webhook replay, signed-URL leakage)
- Privacy review and data-retention runbook
- A native Mexican-Spanish reviewer signs off on the entire ES catalog (`packages/i18n/es.json`)
- Soft launch to 1 partner FLC + 1 grower + 1 training org for two-week observation

**Definition of done:**

- Lighthouse SEO ≥ 95, Performance ≥ 80, A11y ≥ 95, BP ≥ 90 on every public route in CI.
- Pen test report addressed; no critical findings open.
- Partner soft-launch acceptance: ≥ 5 worker placements, ≥ 1 cert issued, ≥ 1 export run.
- Public launch GO/NO-GO meeting passes.

## Critical path

The shortest sequence from "first commit" to "public launch":

```
Phase 0 (foundation)
  └→ Phase 1 (worker + minimal employer postings)
       └→ Phase 2 (FLC verification + billing + applicant review)
            └→ Phase 3 (training + certs)
                 └→ Phase 4 (grant reports)
                      └→ Phase 5 (SEO polish + soft launch)
```

Phase A (landing) and the Twilio A2P 10DLC submission run **in parallel** with Phase 0. Resend domain verification can run alongside.

Earliest realistic public launch: end of Week 7. Soft launch (real partners, no marketing push) end of Week 6.

## Landing-page version progression

The landing page is shipped progressively to avoid blocking on backend availability:

| version             | when   | what's real                                                                                                                                                  | what's mock                                                                                   |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| v1 (Phase A)        | Week 1 | sections, copy, brand, SEO, llms.txt, FAQ; waitlist email capture                                                                                            | Featured Jobs, Featured Training, Impact Numbers, Testimonials, employer logos in Trust Strip |
| v2 (end of Phase 1) | Week 3 | Featured Jobs from real `job_postings` table; "Workers sign up" CTA routes to Clerk OTP                                                                      | Featured Training, Impact Numbers, Testimonials                                               |
| v3 (end of Phase 4) | Week 6 | Featured Training from `training_programs`; Impact Numbers from `/admin/v1/kpi/summary` (public-safe subset); real partner testimonials replace placeholders | —                                                                                             |

Document each version's mock vs. real in `40-marketing/01-landing/08-edge-cases.md`.

## Decisions to lock before/early in the build

| decision                                                           | owner              | needed by                      | status                                     |
| ------------------------------------------------------------------ | ------------------ | ------------------------------ | ------------------------------------------ |
| Public domain (`agconn.com` confirmed available?)                  | founder            | before Phase A                 | open — user noted .com may force a rebrand |
| Brand name (Tierra theme stays regardless; legal name = ?)         | founder + legal    | before Phase A                 | open                                       |
| California PBC formed and registered?                              | founder + legal    | before launch                  | open — footer copy says "AGCONN, PBC"      |
| Twilio Messaging Service + A2P 10DLC campaign details              | engineer           | Day 1 of Phase 0               | open                                       |
| Resend account, sending domain, DNS                                | engineer           | Day 1 of Phase 0               | open                                       |
| Clerk account, SMS OTP enabled, Resend integration set             | engineer           | Day 1 of Phase 0               | open                                       |
| Anthropic API key + data-retention disabled per business agreement | engineer           | before Phase 1 (resume parser) | open                                       |
| Stripe products + price IDs (Pro/Enterprise × Monthly/Yearly)      | engineer + finance | before Phase 2                 | open                                       |
| Native Mexican-Spanish copy reviewer engaged                       | partnerships       | before Phase 5                 | open                                       |
| First CDFA / EDD contact for grant report sign-off (kickoff §11.1) | partnerships       | before Phase 4                 | open                                       |
| Default tenant slug ("central-valley") final?                      | founder            | before Phase 0 close           | locked: `central-valley`                   |
| Logo finalized → `brand/09-logo.md`                                | designer           | before Phase A                 | open                                       |

## Pre-launch human action items (not code)

- Form California Public Benefit Corporation (or confirm existing entity).
- Privacy policy + Terms of Service drafted by counsel; URL slots reserved (`/privacy`, `/terms`, `/accessibility`, `/privacidad`, `/términos`).
- Engage a native Mexican-Spanish reviewer (regional Central Valley accent / register).
- Engage a CDFA / EDD Local Area contact for grant-report column sign-off.
- A2P 10DLC carrier registration (start Day 1 — takes 1–4 weeks).
- Sentry, PagerDuty, Stripe, Anthropic, Azure subscription accounts created.
- Logo finalized and `brand/09-logo.md` written.
- Identify 1 anchor FLC employer + 1 grower + 1 training org for soft launch.

## Definition of done — public launch

A single short list, verified end-to-end before flipping the public DNS:

- [ ] Phase A landing page v3 live with real data in Featured / Impact sections.
- [ ] All Phase 1–5 features pass acceptance criteria in their feature folder.
- [ ] Lighthouse SEO ≥ 95, Performance ≥ 80, A11y ≥ 95, BP ≥ 90 on every public route.
- [ ] WIOA field labels reviewed by a CDFA / EDD contact.
- [ ] Native Mexican-Spanish reviewer signed off on `es.json`.
- [ ] A2P 10DLC campaign approved.
- [ ] Pen test addressed; no critical findings open.
- [ ] Privacy / Terms / Accessibility pages live in EN and ES.
- [ ] Soft-launch metrics met: ≥ 5 placements, ≥ 1 cert issued, ≥ 1 export run.
- [ ] On-call rotation set in PagerDuty.
- [ ] Production DNS pointed; cert-manager TLS valid; backups verified by restore drill.

## Working agreements

- **Specs > Code.** When the implementation differs from a feature folder's `02-data-model.md` / `03-api.md`, fix the spec first (PR with the change), then change the code in the same PR.
- **Brand folder is the visual/verbal source of truth.** When a Tailwind class disagrees with [brand/02-color.md](brand/02-color.md), the brand wins.
- **Bilingual at the same time.** No EN string ships without an ES string, in any surface (UI, SMS, email, cert, OG image).
- **Inferred decisions are overridable.** Anywhere you see `> **Inferred:**` in a spec, override it freely with a documented reason.
- **No emoji** in product UI or marketing copy. Workers and employers can use them; AGCONN doesn't (per [brand/05-voice-tone.md](brand/05-voice-tone.md)).

## Re-planning cadence

This plan is a living document. Update it:

- After each phase's definition-of-done meeting (move what shipped to "done", note what slipped).
- When any decision in the table above resolves.
- When a partner conversation surfaces a new requirement that touches a feature folder — update the folder first, then this plan.
