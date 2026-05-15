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

**Closed 2026-05-14.**

**Goal:** make the resume parser hit the acceptance bar in [07-resume-parser](00-foundation/07-resume-parser/). Was: plain-text-only with no eval harness. Now: full pipeline with extraction → cached LLM call → schema-validation → one-shot repair → normalization → persisted audit row.

| # | item | location | done |
|---|------|----------|------|
| 2.1 | PDF text-layer extraction via pdfjs-dist (legacy node build) | [services/resume-parser/src/extract.ts](../services/resume-parser/src/extract.ts) | [x] |
| 2.2 | DOCX text extraction via mammoth | same | [x] |
| 2.3 | Image-only PDF → Claude PDF document input (deviation from spec — see design note below) | [services/resume-parser/src/extract.ts](../services/resume-parser/src/extract.ts), [services/resume-parser/src/claude.ts](../services/resume-parser/src/claude.ts) | [x] |
| 2.4 | Schema-mismatch repair re-prompt (one retry with explicit issue diff) | [services/resume-parser/src/parser.ts](../services/resume-parser/src/parser.ts), [services/resume-parser/src/prompts.ts](../services/resume-parser/src/prompts.ts) | [x] |
| 2.5 | E.164 phone normalization + safe title-casing for names | [services/resume-parser/src/normalize.ts](../services/resume-parser/src/normalize.ts) | [x] |
| 2.6 | Typed error codes (`no_provider`, `fetch_failed`, `unsupported_format`, `too_little_text`, `ocr_failed`, `llm_failed`, `invalid_json`, `schema_mismatch`) | [services/resume-parser/src/errors.ts](../services/resume-parser/src/errors.ts) | [x] |
| 2.7 | Anthropic prompt cache via direct SDK (`cache_control: ephemeral` on system block) | [services/resume-parser/src/claude.ts](../services/resume-parser/src/claude.ts) | [x] |
| 2.8 | Cost tracking per parse (token-count → USD); persisted to `resume_parse_jobs.cost_usd` | [services/resume-parser/src/cost.ts](../services/resume-parser/src/cost.ts), [services/resume-parser/src/index.ts](../services/resume-parser/src/index.ts) | [x] |
| 2.9 | Eval harness scaffold: fixtures + golden + runner with all five thresholds enforced. Launch set ships with 3 fixtures (EN + ES + empty); spec calls for 50 — grow from real parser failures. | [services/resume-parser/eval/](../services/resume-parser/eval/) | [x] |
| 2.10 | CI job: runs eval on parser or schema changes; two passes (cold + warm) to check cache-hit rate | [.github/workflows/resume-parser-eval.yml](../.github/workflows/resume-parser-eval.yml) | [x] |

**Definition of done:**

- 90%+ schema-valid on eval set, 80%+ field agreement, median latency <12s, cost <$0.05/parse — eval runner enforces all five thresholds and exits 1 on breach.
- PDF, DOCX, plaintext, and HTML formats accepted; image-only PDFs route through Claude's document input (no local OCR).
- Every parse writes a `resume_parse_jobs` audit row with token usage + cost + duration + extract kind.
- `ResumeParseJob` Prisma model added; migration at [packages/db/prisma/migrations/20260514120000_resume_parse_jobs](../packages/db/prisma/migrations/20260514120000_resume_parse_jobs/).
- Default model is **Haiku 4.5** (cheapest); override via `LLM_RESUME_PARSER_MODEL`.
- Dockerfile added at [services/resume-parser/Dockerfile](../services/resume-parser/Dockerfile) with explicit dep enumeration.

**Design deviation from spec (acknowledged):** Spec 01-overview.md §3 calls for `tesseract.js` OCR fallback for image-only PDFs. Implementation instead sends image-only PDFs to Claude as a document content block — Claude does OCR + extraction in one call. Reasons: no native canvas binding required, better ES/handwriting OCR quality, single API call. Adds ~$0.008 per page in OCR token cost; eval still asserts <$0.05/parse mean. Spec should be updated to reflect this.

**Follow-up before deploy:**

- Apply migration to dev/prod DBs: `pnpm --filter @agconn/db db:migrate:deploy`.
- Add `ANTHROPIC_API_KEY` to GitHub Actions secrets for the eval workflow.
- Grow the eval fixture set toward 50; prioritize phone-photo PDFs once we have any production failures to learn from.

## Phase 3 — Cert + audit-log infrastructure ✓ closed 2026-05-14

**Goal:** finish the persistence + admin surfaces around generated certs and audit events. HMAC and circuit breaker were already shipped.

**Audit findings (2026-05-14):** Items 3.4–3.8 were already complete before this phase started — admin audit routes, viewer pages, RLS, retention worker, and CCPA redaction all exist in the codebase. Phase 3 closure work focused on the cert pipeline (3.1–3.3 plus PDF rendering, which the spec implied but the line item didn't make explicit) and the SEO surfaces (3.9, 3.10).

| # | item | location | done |
|---|------|----------|------|
| 3.1 | Supabase Storage adapter for cert PDFs (replaces local fs writer) | [services/cert-generator/src/storage.ts](../services/cert-generator/src/storage.ts) | [x] |
| 3.2 | 24h-signed URL endpoint for cert download | [services/api/src/wallet/routes.ts](../services/api/src/wallet/routes.ts) | [x] |
| 3.3 | Output-size guard (<500 KB) — soft warn via log | [services/cert-generator/src/render.tsx](../services/cert-generator/src/render.tsx) | [x] |
| 3.3a | PDF rendering via @react-pdf/renderer (was HTML) | [services/cert-generator/src/render.tsx](../services/cert-generator/src/render.tsx) | [x] |
| 3.4 | Admin read API for audit events (filters + cursor pagination) | [services/api/src/admin/audit/routes.ts](../services/api/src/admin/audit/routes.ts) | [x] pre-existing |
| 3.5 | Audit admin viewer: list + detail drawer + correlation timeline | [apps/admin/src/app/(shell)/audit/](../apps/admin/src/app/(shell)/audit/) | [x] pre-existing |
| 3.6 | RLS policies on `audit_events` (admin-only read) | [packages/db/prisma/migrations/20260430120000_audit_events](../packages/db/prisma/migrations/20260430120000_audit_events) | [x] pre-existing |
| 3.7 | Nightly retention job — delete events past `retentionDays` | [services/audit-retention/src/index.ts](../services/audit-retention/src/index.ts) | [x] pre-existing |
| 3.8 | CCPA redaction flow with second-factor confirm; HMAC recomputed | [services/api/src/admin/audit/service.ts](../services/api/src/admin/audit/service.ts) | [x] pre-existing |
| 3.9 | Per-item JSON-LD: `JobPosting` + `EducationalOccupationalProgram` via lib | [apps/web/src/lib/seo/json-ld.ts](../apps/web/src/lib/seo/json-ld.ts) | [x] |
| 3.10 | OG image routes `/og/job/[slug]` and `/og/training/[slug]` (1200×630) | [apps/web/src/app/og/](../apps/web/src/app/og/) | [x] |

**Closure notes:**

- `Enrollment.certUrl` now stores a Supabase storage key (e.g. `tenantId/enrollmentId/certificateId.pdf`), not a directly-fetchable URL. The wallet API mints a 24h signed URL on `/wallet/cert/:enrollmentId` and returns `null` on the list endpoint (workers must open detail to mint a URL — keeps signed URLs out of the broader response).
- React-PDF v1 leans on the built-in Helvetica/Courier fonts to stay under the 500 KB budget. Inter/Fraunces subsets remain a TODO; brand fidelity comes from palette + spacing instead. The 500 KB guard is a soft warn (logged via `cert.size_exceeds_budget`), not a hard reject — operators see the signal before it becomes a wallet UX issue.
- The training detail JSON-LD switched from `Course` to `EducationalOccupationalProgram` per the funder-facing schema requirement. The lib version accepts optional `durationHours` and `occupationalCredentialAwarded`; the page currently passes neither — both can be wired up when training-program metadata grows those fields.
- Both detail pages now declare `openGraph.images` pointing at the per-item OG routes. Routes use Node runtime (not edge) because they call the public API via `fetchPublicJob` / `fetchPublicProgram` — daily ISR via `revalidate = 86400` keeps cost bounded.

## Phase 4 — Worker experience completion ✓ closed 2026-05-15

**Goal:** close the per-worker UX gaps. Profile editor, wallet, and onboarding are already solid — the remaining holes are around applications and training.

**Audit findings (2026-05-15):** 8 of 12 items were already shipped (applications/dashboard/field-mode/onboarding/sw). Closure work added the employer email on worker withdraw (3 fixed an inversion bug — code was SMSing the worker instead of emailing the employer), the training-org backend (PATCH program / cancel / bulk-update enrollments), and a new training-org web surface (sidebar, programs list, edit, roster) that did not previously exist.

| # | item | location | done |
|---|------|----------|------|
| 4.1 | Application detail page with event timeline (apply → reviewed → hired/rejected/withdrawn) | [apps/web/src/app/[locale]/worker/applications/[id]/page.tsx](../apps/web/src/app/[locale]/worker/applications/[id]/page.tsx) | [x] pre-existing |
| 4.2 | Withdraw endpoint + UI; allowed only when status ∈ {applied, reviewed} | [services/api/src/applications/routes.ts:218](../services/api/src/applications/routes.ts), [apps/web/src/components/applications/WithdrawButton.tsx](../apps/web/src/components/applications/WithdrawButton.tsx) | [x] pre-existing |
| 4.3 | Employer email on worker withdraw (was: SMS to worker — bug; spec says no worker notification, employer email) | [packages/email/src/strings/employer.ts](../packages/email/src/strings/employer.ts), [services/api/src/applications/routes.ts:251-274](../services/api/src/applications/routes.ts) | [x] |
| 4.4 | Worker dashboard recommendations (county + skills priority feed) | [services/api/src/jobs/routes.ts:188](../services/api/src/jobs/routes.ts) | [x] pre-existing |
| 4.5 | Training program cancellation broadcast (SMS to all enrolled in worker's locale) | [services/api/src/training/routes.ts](../services/api/src/training/routes.ts), [packages/sms/src/templates/index.ts](../packages/sms/src/templates/index.ts) `training.canceled` | [x] |
| 4.6 | Bulk enrollment status update endpoint + UI (mark completed / dropped / no-show) | [services/api/src/training/routes.ts](../services/api/src/training/routes.ts) `PATCH /:id/enrollments`, [apps/web/src/components/training-org/Roster.tsx](../apps/web/src/components/training-org/Roster.tsx) | [x] |
| 4.7 | Training-org program editor endpoint + UI (description + session times + location after publish) | `PATCH /v1/org/training/:id`, [apps/web/src/components/training-org/ProgramEditForm.tsx](../apps/web/src/components/training-org/ProgramEditForm.tsx) | [x] |
| 4.8 | IndexedDB onboarding state restore (tab close → reopen resumes at step) | [apps/web/src/lib/onboarding-draft.ts](../apps/web/src/lib/onboarding-draft.ts) | [x] pre-existing |
| 4.9 | Field mode: SMS-only apply flow | [apps/web/src/app/[locale]/field/apply/page.tsx](../apps/web/src/app/[locale]/field/apply/page.tsx) | [x] pre-existing |
| 4.10 | Field mode: quick withdraw on applications list | [apps/web/src/components/field/applications/MyApplicationsList.tsx](../apps/web/src/components/field/applications/MyApplicationsList.tsx) | [x] pre-existing |
| 4.11 | Field mode: service-worker offline cache for today's shift + messages | [apps/web/src/app/sw.ts](../apps/web/src/app/sw.ts) (Serwist) | [x] pre-existing |
| 4.12 | Resume editor: re-upload triggers parser, status polled at `/v1/profile/resume/status` | [apps/web/src/app/[locale]/worker/profile/reupload/page.tsx](../apps/web/src/app/[locale]/worker/profile/reupload/page.tsx), `pollResumeStatusAction` | [x] pre-existing |

**Definition of done:**

- Worker can withdraw from `applied`/`reviewed` and employer receives an email (no longer the worker getting their own SMS).
- Cancelled training program enqueues SMS to every enrolled worker in the correct locale (via the existing per-user `preferredLang` resolution in `@agconn/sms`).
- Field-mode user with no network sees yesterday's shift card from cache (Serwist NetworkFirst with 4s timeout).
- Onboarding survives accidental tab close (IDB keyed by clerk user id).
- Training-org users have a working surface at `/[locale]/training-org/programs` to edit, cancel, and bulk-roster their programs.

**Closure notes:**

- Strings on the new training-org surface are inlined `locale === 'es' ? '…' : '…'` rather than going through the DB-backed `translation_keys` flow. This keeps the patch self-contained; a follow-up can hoist them into the seed bundles once the surface has stable wording.
- `EmployerProfile` has no `preferredLang` column — the withdraw email defaults to `'en'`, matching how every other `enqueueEmployerEmail` caller already behaves (see `admin/employers/routes.ts`). Adding employer locale routing is a cross-cutting follow-up.
- The training-org cancel route iterates enrollments and enqueues SMS in a loop — fine at MVP scale (capacity capped at 500). At higher fan-out, switch to a single fanout job that the SMS worker expands.
- The deprecated `application.withdrawn` SMS template stays in the catalog; nothing dispatches it anymore. Removable in a later cleanup pass.

## Phase 5 — Admin & employer polish ✓ closed 2026-05-15

**Goal:** finish the dashboard surfaces. Reports are shipped; KPI export, auto-refresh, and compliance audit binder remain.

**Audit findings (2026-05-15):** the printable audit binder page already existed (it's HTML-styled-for-print with letterhead, sections, and signature lines, reached via `/employer/compliance/audit`). The missing piece against the spec was the **evidence index** — items had `evidence` and `evidenceUrl` payloads but the binder page never rendered them. Otherwise everything in this phase was new.

| # | item | location | done |
|---|------|----------|------|
| 5.1 | KPI dashboard CSV export (current filters) | [services/api/src/admin/kpi/routes.ts](../services/api/src/admin/kpi/routes.ts) `GET /admin/v1/kpi/export.csv`, [apps/admin/src/components/admin-shell/KpiActions.tsx](../apps/admin/src/components/admin-shell/KpiActions.tsx) | [x] |
| 5.2 | KPI auto-refresh toggle (60s polling) | [apps/admin/src/components/admin-shell/KpiActions.tsx](../apps/admin/src/components/admin-shell/KpiActions.tsx) | [x] |
| 5.3 | Compliance audit-binder PDF — added evidence index section to the print-to-PDF binder | [apps/web/src/app/[locale]/employer/(shell)/compliance/audit/page.tsx](../apps/web/src/app/[locale]/employer/(shell)/compliance/audit/page.tsx) | [x] |
| 5.4 | Compliance export CSV | [services/api/src/employer/compliance/routes.ts](../services/api/src/employer/compliance/routes.ts) `GET /v1/employer/compliance/export.csv`, [apps/web/src/app/api/employer/compliance/export.csv/route.ts](../apps/web/src/app/api/employer/compliance/export.csv/route.ts) | [x] |
| 5.5 | Cross-tenant visibility test for KPI tiles | deferred to Phase 6 (no test runner exists anywhere in the monorepo yet) | [ ] deferred |

**Definition of done:**

- KPI dashboard downloads a CSV that matches the visible tiles for the current filter set (4 rows: placements / training / employers / wages, with trend deltas where applicable).
- KPI dashboard auto-refresh is a URL-state toggle (`?autoRefresh=1`) that fires `router.refresh()` every 60s while on, matching the admin filter-state convention.
- Employer audit binder includes an "Evidence index" section listing every item with an uploaded file or external URL, with kind + filename/url + size.
- Employer can download a compliance CSV (category, item_key, label, status, due_at, resolved_at, details, evidence pointer).

**Closure notes:**

- The audit binder is a print-to-PDF HTML page rather than a server-rendered PDF. This was the existing approach when the audit started — the route, letterhead, sections, and signature lines were already in place. The evidence index closes the spec gap without rewriting the renderer; a future React-PDF version can be lifted from the cert-generator pattern if a server-side artifact becomes necessary (e.g., emailable attachments).
- KPI export is structural (one row per metric tile, plus trend delta) rather than per-employer or per-application. The detailed reports under `/reports/*` already export their own row-level CSVs via the generic `/api/export/[...path]` proxy.
- The compliance CSV is read through a thin web proxy at `/api/employer/compliance/export.csv` that forwards the Clerk JWT and streams the upstream response — same pattern as `apps/admin/src/app/api/export/[...path]/route.ts`. Kept the data-shaping in the api (next to the read path) so the two CSVs and the binder cannot drift.
- 5.5 (cross-tenant KPI test) is deferred to Phase 6 alongside the test-runner bootstrap. The KPI service is already structurally cross-tenant — it adds a `tenantId` clause only when callers pass `tenantIds`, and the admin middleware sets `app.role = 'admin'` (RLS bypass) — so the behavior to verify is the no-filter default. Once vitest is wired in Phase 6, the test is a one-file add.

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
- 2026-05-14 — Phase 2 closed (10/10 items). Default model: Haiku 4.5. OCR strategy: Claude PDF document input (spec deviation acknowledged).
- 2026-05-14 — Resume-parser text+repair routed through llm-harness; `claude.ts` deleted, `llm.ts` is the new call layer. PDF path stays direct-SDK pending harness document support. Fixed pre-existing model-resolution bug in `packages/llm/src/router.ts`.
- 2026-05-14 — Phase 3 closed (11/11 items). 5 items (3.4–3.8) were already shipped; closure work added the cert PDF pipeline (React-PDF → Supabase Storage → 24h signed URLs), per-item JSON-LD (`JobPosting`, `EducationalOccupationalProgram`), and per-item OG image routes.
- 2026-05-14 — Upgraded `llm-harness` to 0.3.1 (adds `DocumentContent` blocks, `cacheable` flag on requests, `cacheReadTokens`/`cacheCreationTokens` on Usage). Resume-parser PDF path migrated through the harness; `@anthropic-ai/sdk` removed from the service entirely. Cache tokens now flow through `resume_parse_jobs.cacheReadTokens`/`cacheWriteTokens` again on the text path.
- 2026-05-15 — Phase 4 closed (12/12 items). 8 were pre-existing (applications/dashboard/field-mode/onboarding/sw/resume re-upload). New: 4.3 fixed a notification inversion bug — withdraw was SMSing the worker instead of emailing the employer; `employer.application_withdrawn` template + wiring landed. 4.5/4.6/4.7 added training-org backend (`PATCH /v1/org/training/:id`, `POST /v1/org/training/:id/cancel`, `PATCH /v1/org/training/:id/enrollments`). A new training-org web surface (sidebar, programs list, edit, roster with bulk actions) ships at `/[locale]/training-org/programs`.
- 2026-05-15 — Phase 5 closed (4/5 items). 5.1 KPI CSV (`GET /admin/v1/kpi/export.csv`, 4-row metrics shape), 5.2 KPI auto-refresh (URL-state toggle, 60s `router.refresh()`), 5.3 evidence index added to the existing print-to-PDF audit binder, 5.4 compliance CSV (`GET /v1/employer/compliance/export.csv` + web proxy). 5.5 (cross-tenant KPI test) deferred to Phase 6 — no test runner exists in the monorepo yet, and the KPI service is already structurally cross-tenant.
