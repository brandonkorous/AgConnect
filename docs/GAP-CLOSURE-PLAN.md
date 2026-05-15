# AGCONN — Gap Closure Plan

Post-launch (2026-05-05) tracking doc for closing the gap between [feature specs](README.md) and shipped code. Created 2026-05-14 from a comprehensive spec-vs-code audit.

**How to read this plan**

- Each phase has a goal, a checklist of items with code locations, a definition of done, and risks.
- Items are ordered by user-visible impact and correctness urgency, not by spec number.
- Update the checkbox and date as work lands. When a phase closes, add a `Closed YYYY-MM-DD` note under its header.
- The original [PROJECT-PLAN.md](PROJECT-PLAN.md) remains the historical record of the pre-launch build.

## Audit baseline — 2026-05-14

Roughly **85% of acceptance criteria** across all 32 spec folders are shipped. The remaining work clusters into three buckets:

| bucket                                                 | size  |
| ------------------------------------------------------ | ----- |
| Correctness / compliance bugs (billing, locale)        | small |
| Foundation hardening (parser, cert storage, audit log) | large |
| Infra & CI/CD (deploy, preview envs, scans)            | large |

Worker UI and employer UI are substantially complete — Profile editor, FLC verification, Kanban, payroll calc, compliance scoring, messaging, employer reports, KPI dashboard, placement/training/employer-activity reports are all live and wired end-to-end.

## Phase 1 — Critical correctness (2–3 days)

**Closed 2026-05-14.**

**Goal:** stop user-visible bugs that affect billing, locale, or SEO before they accumulate ill will.

| # | item | location | done |
|---|------|----------|------|
| 1.1 | Gate applicant SMS by plan feature `applicantSms` (single-transition + bulk-transition) | [services/api/src/employer/applications/routes.ts](../services/api/src/employer/applications/routes.ts) | [x] |
| 1.2 | Flip default locale from `en` to `es` per [i18n spec](00-foundation/04-i18n/) | [apps/web/src/i18n/routing.ts](../apps/web/src/i18n/routing.ts) | [x] |
| 1.3 | Return `410 Gone` from job detail (public + authenticated) for closed/expired jobs; add `job_gone` standard error; frontend renders bilingual "listing closed" state | [services/api/src/landing/jobs.ts](../services/api/src/landing/jobs.ts), [services/api/src/jobs/routes.ts](../services/api/src/jobs/routes.ts), [packages/api-client/src/errors.ts](../packages/api-client/src/errors.ts), [apps/web/src/app/[locale]/jobs/[slug]/page.tsx](../apps/web/src/app/[locale]/jobs/[slug]/page.tsx), [apps/web/src/app/[locale]/worker/jobs/[slug]/page.tsx](../apps/web/src/app/[locale]/worker/jobs/[slug]/page.tsx) | [x] |
| 1.4 | Reject saved-search SMS alert with `422 phone_required` on POST and PATCH when worker has no phone | [services/api/src/jobs/routes.ts](../services/api/src/jobs/routes.ts) | [x] |
| 1.5 | ~~Reject worker apply with `403` if `onboardedAt` is null.~~ **Spec updated 2026-05-14** — code at [services/api/src/applications/routes.ts:35-41](../services/api/src/applications/routes.ts) intentionally waives this gate on dignity grounds; spec at [10-worker/04-application-tracker/07-acceptance.md](10-worker/04-application-tracker/07-acceptance.md) + [08-edge-cases.md](10-worker/04-application-tracker/08-edge-cases.md) rewritten to match. | n/a | [x] |

**Definition of done:**

- Free-tier employers do not trigger SMS to applicants (verified by tracing both enqueue sites).
- New visitor with no `accept-language` lands on `/es`.
- Closed-job detail returns 410 with bilingual body and `noindex` metadata; SEO crawlers will drop the URL.
- SMS-channel saved-search alert creation/update rejects when worker has no phone on file.
- Worker-apply behavior frozen per dignity policy; spec reflects code.

**Follow-up:** run `pnpm --filter @agconn/db i18n:seed` to push the new `public_jobs.detail.closed_*` translation keys into the DB.

## Phase 2 — Resume parser productionization (1 week)

**Goal:** make the resume parser hit the acceptance bar in [07-resume-parser](00-foundation/07-resume-parser/). Today it accepts plain text only and has no eval harness.

| # | item | location | done |
|---|------|----------|------|
| 2.1 | PDF text extraction (textract step before LLM) | [services/resume-parser/src/parser.ts](../services/resume-parser/src/parser.ts) | [ ] |
| 2.2 | DOCX text extraction | same | [ ] |
| 2.3 | OCR fallback for image-only PDFs (Tesseract or cloud OCR) | same | [ ] |
| 2.4 | Schema-mismatch repair re-prompt (one retry with diff) | same | [ ] |
| 2.5 | E.164 phone normalization on parsed output | [packages/llm/src/parsers/resume.ts](../packages/llm/src/parsers/resume.ts) | [ ] |
| 2.6 | Standardize error codes (`parse_failed:too_little_text`, etc.) | [services/resume-parser/src/parser.ts:38](../services/resume-parser/src/parser.ts) | [ ] |
| 2.7 | Anthropic prompt cache hints (system prompt + schema as cached prefix) | [packages/llm/src/clients/anthropic.ts](../packages/llm/src/clients/anthropic.ts) | [ ] |
| 2.8 | Cost tracking per parse (token-count → USD); cap log | new | [ ] |
| 2.9 | Eval harness: 50 resumes (EN + ES) with golden outputs; schema-valid + field-agreement metrics | `services/resume-parser/eval/` | [ ] |
| 2.10 | CI job that runs eval on every change to parser or prompt | [.github/workflows/](../.github/workflows/) | [ ] |

**Definition of done:**

- 90%+ schema-valid on eval set, 80%+ field agreement, median latency <12s, cost <$0.05/parse, cache hit ≥80% after warmup.
- All file types from spec accepted; image-only PDFs flow through OCR.
- Eval results posted to PR comments.

## Phase 3 — Cert + audit-log infrastructure (1 week)

**Goal:** finish the persistence + admin surfaces around generated certs and audit events. HMAC and circuit breaker are already shipped — what's missing is storage, read API, and viewer.

| # | item | location | done |
|---|------|----------|------|
| 3.1 | Supabase Storage adapter for cert PDFs (replaces local fs writer) | [services/cert-generator/src/storage.ts](../services/cert-generator/src/storage.ts) | [ ] |
| 3.2 | 24h-signed URL endpoint for cert download | [services/api/src/worker/wallet/routes.ts](../services/api/src/worker/wallet/routes.ts) | [ ] |
| 3.3 | Output-size guard (<500 KB) with shrink-image fallback | [services/cert-generator/src/render.ts](../services/cert-generator/src/render.ts) | [ ] |
| 3.4 | Admin read API: `GET /admin/v1/audit/events`, `GET /admin/v1/audit/events/:id`, `GET /admin/v1/audit/verify` (filters + cursor pagination) | new under `services/api/src/admin/audit/` | [ ] |
| 3.5 | Audit admin viewer: list + detail drawer + correlation timeline + actor history | [apps/admin/src/app/(shell)/audit/](../apps/admin/src/app/(shell)/audit/) | [ ] |
| 3.6 | RLS policies on `audit_events` (admin-only read) | [packages/db/prisma/migrations](../packages/db/prisma/migrations) | [ ] |
| 3.7 | Nightly retention job — delete events past `retentionDays`; emit `system.audit.purged` | [services/audit-retention/src/](../services/audit-retention/src/) | [ ] |
| 3.8 | CCPA redaction flow with second-factor confirm; HMAC recomputed | [services/audit-retention/src/redact.ts](../services/audit-retention/src/redact.ts) | [ ] |
| 3.9 | Per-item JSON-LD: `JobPosting` on job detail, `EducationalOccupationalProgram` on training detail (current code emits `ItemList`) | [apps/web/src/lib/seo/json-ld.ts](../apps/web/src/lib/seo/json-ld.ts) | [ ] |
| 3.10 | OG image route `/og/landing`, `/og/job/[slug]`, `/og/training/[id]` returns 1200×630 PNG | [apps/web/src/app/og/](../apps/web/src/app/og/) | [ ] |

**Definition of done:**

- Workers downloading certs hit signed Supabase URLs that expire in 24h.
- Admin can filter audit events by tenant/actor/action/correlation; detail drawer shows verified status.
- Retention deletes per action's `retentionDays`; verified by integration test.
- Google's Rich Results test passes for a sample job and training page.

## Phase 4 — Worker experience completion (1–2 weeks)

**Goal:** close the per-worker UX gaps. Profile editor, wallet, and onboarding are already solid — the remaining holes are around applications and training.

| # | item | location | done |
|---|------|----------|------|
| 4.1 | Application detail page with event timeline (apply → reviewed → hired/rejected/withdrawn) | `apps/web/src/app/[locale]/(worker)/applications/[id]/page.tsx` | [ ] |
| 4.2 | Withdraw endpoint + UI; allowed only when status ∈ {applied, reviewed} | [services/api/src/worker/applications/routes.ts](../services/api/src/worker/applications/routes.ts) | [ ] |
| 4.3 | Employer email on worker withdraw | [packages/email/src/templates/](../packages/email/src/templates/) | [ ] |
| 4.4 | Worker dashboard recommendations (county + skills priority feed) | new — `apps/web/src/app/[locale]/(worker)/page.tsx` | [ ] |
| 4.5 | Training program cancellation broadcast (SMS to all enrolled within 5 min) | [services/api/src/training-org/programs/cancel.ts](../services/api/src/training-org/programs/cancel.ts) | [ ] |
| 4.6 | Bulk enrollment status update UI (mark completed / dropped / no-show) | [apps/web/src/app/[locale]/training-org/programs/[id]/roster/](../apps/web/src/app/[locale]/training-org/programs/[id]/roster/) | [ ] |
| 4.7 | Training-org program editor (description + session times after publish) | [apps/web/src/app/[locale]/training-org/programs/[id]/edit/](../apps/web/src/app/[locale]/training-org/programs/[id]/edit/) | [ ] |
| 4.8 | IndexedDB onboarding state restore (tab close → reopen resumes at step) | [apps/web/src/lib/onboarding/persist.ts](../apps/web/src/lib/onboarding/persist.ts) | [ ] |
| 4.9 | Field mode: SMS-only apply flow | `apps/web/src/app/[locale]/field/jobs/[id]/apply/` | [ ] |
| 4.10 | Field mode: quick withdraw on applications list | `apps/web/src/app/[locale]/field/applications/` | [ ] |
| 4.11 | Field mode: service-worker offline cache for today's shift + messages | [apps/web/public/sw.js](../apps/web/public/sw.js) | [ ] |
| 4.12 | Resume editor: re-upload triggers parser, status polled at `/v1/profile/resume/status`; previous Blob path retained as backup | [apps/web/src/app/[locale]/(worker)/profile/](../apps/web/src/app/[locale]/(worker)/profile/) | [ ] |

**Definition of done:**

- Worker can withdraw from `applied`/`reviewed` and employer receives notification.
- Cancelled training program SMSs every enrolled worker in correct locale.
- Field-mode user with no network sees yesterday's shift card from cache.
- Onboarding survives accidental tab close.

## Phase 5 — Admin & employer polish (3–5 days)

**Goal:** finish the dashboard surfaces. Reports are shipped; KPI export, auto-refresh, and compliance audit binder remain.

| # | item | location | done |
|---|------|----------|------|
| 5.1 | KPI dashboard CSV export (current filters) | [apps/admin/src/app/(shell)/page.tsx](../apps/admin/src/app/(shell)/page.tsx) | [ ] |
| 5.2 | KPI auto-refresh toggle (60s polling) | same | [ ] |
| 5.3 | Compliance audit-binder PDF (employer-side; concatenated items + evidence index) | [services/api/src/employer/compliance/audit-binder.ts](../services/api/src/employer/compliance/audit-binder.ts) | [ ] |
| 5.4 | Compliance export CSV | same | [ ] |
| 5.5 | Cross-tenant visibility test for KPI tiles (verifies admin sees all tenants) | `apps/admin/src/__tests__/` | [ ] |

**Definition of done:**

- KPI dashboard downloads a CSV that matches the visible tiles for the current filter set.
- Employer can download a single PDF with all compliance items + evidence links, suitable for an external auditor.

## Phase 6 — Infra & CI/CD (1–2 weeks)

**Goal:** make production deployable from `main` with no manual steps. Target stack per `project_deployment_target.md` is **GKE Standard zonal `us-west1-a`**, not AKS — the [infra spec](00-foundation/10-infra-cicd/) is older and references AKS; reconcile that here.

| # | item | location | done |
|---|------|----------|------|
| 6.1 | GKE cluster Terraform (1× e2-medium pool, autoscale 1–3 nodes) | `infra/terraform/gke.tf` | [ ] |
| 6.2 | nginx-ingress + cert-manager + Cloudflare DNS01 ClusterIssuer | `infra/k8s/ingress/` | [ ] |
| 6.3 | Artifact Registry + Workload Identity for image pulls | `infra/terraform/artifact-registry.tf` | [ ] |
| 6.4 | K8s manifests: web, api, admin, sms-worker, email-worker, resume-parser, cert-generator, audit-retention, audit-verifier, flc-verifier, scheduler (Deployments + Services + HPA) | `infra/k8s/apps/` | [ ] |
| 6.5 | DB migrations as Init Container; failure blocks rollout | `infra/k8s/apps/api/init-migrate.yaml` | [ ] |
| 6.6 | GitHub Actions deploy pipeline: build → push → staging → manual approval → prod | [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) | [ ] |
| 6.7 | PR preview environments at `pr-<id>.preview.agconn.com` | [.github/workflows/preview.yml](../.github/workflows/preview.yml) | [ ] |
| 6.8 | Trivy image scan gate (high/critical → fail build) | CI | [ ] |
| 6.9 | NetworkPolicy + PodSecurityStandards: restricted | `infra/k8s/policy/` | [ ] |
| 6.10 | Sentry SDK wired with `GITHUB_SHA` release tag | [packages/observability/](../packages/observability/) | [ ] |
| 6.11 | Lighthouse CI gate (SEO ≥95, Perf ≥80, A11y ≥95) on top-5 public pages | [.github/workflows/lighthouse.yml](../.github/workflows/lighthouse.yml) | [ ] |
| 6.12 | Reconcile [00-foundation/10-infra-cicd](00-foundation/10-infra-cicd/) spec: AKS → GKE everywhere | docs | [ ] |

**Definition of done:**

- A push to `main` reaches prod within 15 min after approval, with zero downtime.
- PR open creates a preview env within 10 min; PR close tears it down.
- Lighthouse and Trivy block merges that regress thresholds.

## Phase 7 — Resources v2 + content (Q3 2026, deferred)

**Goal:** ship the long-form content that [40-marketing/04-resources](40-marketing/04-resources/) reserves space for. Empty state and route are already live.

| # | item | done |
|---|------|------|
| 7.1 | 6 launch articles in MDX (EN + ES), 3 worker-facing + 3 employer-facing | [ ] |
| 7.2 | Per-article `Article` JSON-LD | [ ] |
| 7.3 | Per-article OG image generator | [ ] |
| 7.4 | RSS feed at `/rss.xml` | [ ] |
| 7.5 | Category filter + reading-time | [ ] |

**Definition of done:** 6 articles indexed by Google within 7 days of publish; RSS validates.

## Sequencing notes

- **Phase 1 should ship today or tomorrow** — applicant SMS gate is a billing leak.
- **Phase 2 (parser) and Phase 3 (cert + audit + SEO) can run in parallel** if there are two engineers.
- **Phase 4** is the largest user-visible bucket and benefits most from sub-phase parallelism (applications track / training-org track / field-mode track).
- **Phase 5** is small enough to slot between any two larger phases.
- **Phase 6** is the bottleneck for shipping to a real production cluster; until then we are running ad-hoc. Start it in parallel with Phase 2 if a second engineer is available.
- **Phase 7** is content + Q3 — not unblocking anything.

## Open decisions

| topic | needs | owner |
|-------|-------|-------|
| AKS → GKE spec reconcile | Confirm GKE is the long-term target before rewriting [00-foundation/10-infra-cicd](00-foundation/10-infra-cicd/) | user |
| OCR provider | Tesseract self-hosted vs Document AI vs Textract — cost/latency tradeoff | user |
| Lighthouse CI threshold pages | Confirm the top-5 pages (landing/jobs index/job detail/training index/FAQ?) | user |
| Resources article topics | Final list of 6 launch articles | user |

## Change log

- 2026-05-14 — initial draft from comprehensive spec-vs-code audit.
- 2026-05-14 — Phase 1 closed (5/5 items: 4 fixes shipped + 1 spec reversal on dignity grounds).
