# 10 — Infra & CI/CD: GitHub Actions Pipelines

The authoritative workflows live in [`.github/workflows/`](../../../.github/workflows/). This doc summarizes intent — if it disagrees with the YAML, the YAML wins.

## Workflow inventory

| workflow                  | trigger                  | purpose                                                            |
| ------------------------- | ------------------------ | ------------------------------------------------------------------ |
| `ci.yml`                  | PR + push to `main`      | typecheck, conventions (tenant_id, RLS), i18n parity, build smoke  |
| `deploy.yml`              | push to `main` + manual  | build matrix → migrate Job → kustomize apply → rollout             |
| `lighthouse.yml`          | PR touching `apps/web/`  | Perf ≥80, A11y ≥95, SEO ≥95 on top public pages                    |
| `resume-parser-eval.yml`  | parser-touching changes  | parser schema-valid / field-agreement / latency / cost thresholds  |
| `preview.yml` *(planned)* | PR open/sync             | preview namespace at `pr-<id>.preview.agconn.com` *(Phase 6 gap)*  |

## ci.yml

Real-Postgres job that:

1. Installs deps via pnpm.
2. Generates Prisma client.
3. Typechecks the whole repo.
4. Runs `pnpm check:conventions` — enforces every table has `tenant_id`, every model has RLS, etc.
5. Migrates the CI Postgres and seeds translations.
6. Runs `pnpm --filter @agconn/web i18n:check` against the seeded DB.
7. Builds `packages/` then `apps/web` as a smoke check.

Sentry source map upload is skipped on PR builds (`SENTRY_AUTH_TOKEN=""`).

## deploy.yml

Two jobs.

### `build` (matrix)

Builds + pushes one image per service. Matrix entries: `web`, `admin`, `api`, `email-worker`, `sms-worker`, `flc-verifier`, `audit-retention`, `audit-verifier`, `resume-parser`, `cert-generator`, `scheduler`.

Each leg:

1. Federates to GCP via Workload Identity Federation (`google-github-actions/auth`).
2. Configures docker for Artifact Registry.
3. Builds and pushes with `cache-from`/`cache-to` GHA scope per image.
4. `NEXT_PUBLIC_*` build-args are inlined into web/admin client bundles. `SENTRY_RELEASE=${{ github.sha }}` is passed as a build-arg and an env var so all SDKs tag events with the deploy commit.

*Trivy CVE scan gate is deferred at MVP — see Phase 6 item 6.8 in [GAP-CLOSURE-PLAN.md](../../GAP-CLOSURE-PLAN.md). When re-enabled it slots in as step 5.*

### `deploy` (single)

`needs: build` so any failed build (or, when re-enabled, Trivy scan) blocks the entire deploy.

1. Federates to GCP, fetches GKE credentials for `agconn-prod` in `us-west1-a`.
2. Applies namespace + ServiceAccount + ConfigMap (bootstrap resources the migrate Job needs).
3. Renders the runtime Secret `agconn-env` from GitHub Actions secrets (`kubectl create secret --dry-run | apply`).
4. Pins image tags in `deploy/k8s/overlays/prod` via `kustomize edit set image` for all 11 services.
5. Runs the db-migrate Job (`db-migrate-<SHA>`) and waits up to 10 minutes for completion. Logs are dumped on failure.
6. `kubectl apply -k deploy/k8s/overlays/prod`.
7. Waits on `rollout status` for every Deployment (5–10 min each).

The job runs under `environment: ${{ inputs.environment || 'prod' }}`. The `prod` GitHub Environment can enforce required-reviewer protection rules at the platform level; the workflow YAML does not embed an approval step.

## lighthouse.yml

PR-scoped workflow on `apps/web/**`, `packages/ui/**`, `packages/i18n/**`, the LHCI config, or the workflow file itself.

1. Spins up a CI Postgres + migrates + seeds translations so the build can read `translation_keys`.
2. Builds packages and `apps/web`.
3. Runs `@lhci/cli autorun` against:
   - `/en`, `/es`, `/en/jobs`, `/en/training`, `/en/faq`

Asserts Perf ≥0.80, A11y ≥0.95, SEO ≥0.95 as errors; Best Practices ≥0.90 as warn. Failing assertions fail the job. Reports upload to LHCI temporary public storage.

## resume-parser-eval.yml

Runs the eval harness on parser- or schema-touching changes. Enforces the five thresholds documented in [00-foundation/07-resume-parser](../07-resume-parser/). Two-pass run measures cold + warm prompt cache hit rates.

## preview.yml *(planned — Phase 6 gap 6.7)*

Per-PR preview environments at `pr-<id>.preview.agconn.com`. Open questions:

- Reuse the prod cluster with a namespace overlay (`pr-<id>`) vs. spin a tiny separate cluster.
- Reuse the prod Supabase DB with a per-PR `tenant_id` namespace vs. issue a per-PR Supabase branch.
- DNS — wildcard `*.preview.agconn.com` CNAME to the same static ingress IP, ingress rules routed by host.
- Teardown — `on: pull_request` types `[closed]` matches both merge and close.

## Dockerfile pattern

Three-stage `node:22-bookworm-slim` shape. See `services/api/Dockerfile` as the canonical example; every service and app follows the same layout:

1. **deps** — install pnpm, copy `package.json` files only, run `pnpm install --frozen-lockfile` with a buildkit cache mount for the pnpm store and a buildkit secret for `FONTAWESOME_TOKEN`.
2. **build** — copy the full repo, generate the Prisma client, build `./packages/**`, then build the target.
3. **runtime** — slim base, non-root `agconn` user (uid 1001), `CMD ["node", "<service>/dist/index.js"]`.

Web and admin pass `NEXT_PUBLIC_*` as build-args so Next inlines them into the client bundle. `SENTRY_RELEASE` is both a build-arg (client bundle) and a runtime env (server SDK).

## Secrets in CI

GitHub repository secrets (see `actionsecrets.md` for the full list). Highlights:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` + `GCP_DEPLOY_SERVICE_ACCOUNT` — federated GCP auth, no static keys.
- `FONTAWESOME_TOKEN` — passed as a buildkit secret, never inlined.
- `DATABASE_URL`, `DIRECT_URL` — Supabase Postgres pooler + direct URLs.
- Clerk web + Clerk admin keys (two separate Clerk instances).
- Sentry DSNs (web + admin), `SENTRY_AUTH_TOKEN` for source map upload, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_PROJECT_ADMIN`.
- Stripe live keys + price IDs (5 tiers).
- Twilio SID + token + messaging service SID + inbound number.
- Resend API key + webhook secret.
- Supabase service-role key (Storage uploads).
- `AUDIT_HMAC_KEY` + version, `PARTICIPANT_PEPPER`, `CLERK_ENCRYPTION_KEY`, `INTERNAL_REVALIDATE_SECRET`.

Production-runtime secrets are written into the `agconn-env` K8s Secret on every deploy. There is no in-cluster KMS / CSI secret store at MVP.

## Branch protection

- `main` — protected; requires PR + review + CI green.
- Direct push blocked.
- Squash-merge preferred for clean history.

## Environments and approval

- `prod` — required reviewers list at the GitHub Environment level. No separate staging cluster.
- Preview environments are namespace-per-PR, not their own GitHub Environment.
