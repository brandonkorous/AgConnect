# 10 — Infra & CI/CD: Overview

## Purpose

Host AGCONN on **Google Kubernetes Engine (GKE) Standard zonal**, build and store images in **Google Artifact Registry (AR)**, and deploy via GitHub Actions on push to `main`. (Original kickoff ADR-004 specified AKS + GHCR + Helm; that target was changed pre-build to GKE + AR + Kustomize. See [docs/decisions/](../../decisions/) and `project_deployment_target.md` for the rationale.)

## What this layer owns

- GKE cluster topology — Deployments, Services, Ingress, HPA, NetworkPolicy, Pod Security Admission
- Artifact Registry image build, push, retention, Trivy CVE scan
- GitHub Actions pipeline — build → scan → migrate → apply → rollout
- Environment strategy — local / PR preview / prod (no separate staging cluster at MVP)
- Secret management — GitHub Actions secrets → K8s `agconn-env` Secret
- TLS certs via cert-manager + Let's Encrypt + Cloudflare DNS01
- Sentry release tagging + source map upload
- Observability — GCP Cloud Logging + Sentry (Prometheus/Grafana deferred)
- Database backups — Supabase managed PITR

## Stack

- **GKE Standard zonal** (`us-west1-a`) — managed K8s
- **Google Artifact Registry** — `us-west1-docker.pkg.dev/<project>/containers/<image>:<sha>`
- **GitHub Actions** — CI/CD; federated to GCP via Workload Identity Federation (no static service-account keys)
- **Kustomize 5** — `deploy/k8s/base` + `deploy/k8s/overlays/{prod,preview}` (Helm rejected for MVP — fewer indirections at this scale)
- **nginx-ingress** — Layer 7 ingress, single static IP
- **cert-manager** — Let's Encrypt automation via Cloudflare DNS01 (HTTP01 doesn't work behind Cloudflare proxy)
- **Cloudflare** — DNS + WAF (orange-cloud proxied)
- **Trivy** — image CVE scan gate in CI (HIGH/CRITICAL + fixed-available fails the build)
- **Lighthouse CI** — perf / a11y / SEO gate on top public pages
- **Sentry** — application error tracking (web, admin, api, audit-retention, audit-verifier)
- **Supabase** — Postgres + Storage (managed; outside cluster)

## Topology summary

```
Internet
  ↓
Cloudflare DNS + WAF (agconn.com, www.agconn.com, api.agconn.com, admin.agconn.com)
  ↓
GKE LoadBalancer Service → ingress-nginx (pinned static IP)
  ↓
─ web            (Next.js, pool=app, HPA cpu=70%)
─ admin          (Next.js, pool=app)
─ api            (Hono,    pool=app, HPA cpu=70%)
─ email-worker   (pg-boss, pool=worker on spot)
─ sms-worker     (pg-boss, pool=worker on spot)
─ resume-parser  (pg-boss, pool=worker on spot)
─ cert-generator (pg-boss, pool=worker on spot)
─ scheduler      (pg-boss, pool=worker on spot, replicas=1 singleton)
─ flc-verifier   (pg-boss, pool=worker on spot)
─ audit-retention (CronJob 02:00 UTC, pool=worker on spot)
─ audit-verifier  (CronJob 03:00 UTC, pool=worker on spot)

Supabase Postgres (managed, separate)
Supabase Storage (managed, signed-URL access)
```

Three node pools:

- **system** — 1× `e2-small` on-demand, untainted. Holds ingress-nginx, cert-manager, kube-system.
- **app** — `e2-medium` on-demand, autoscale 1–3, taint `pool=app:NoSchedule`. Holds web/admin/api/db-migrate.
- **worker** — `e2-small` **spot**, autoscale 0–N. Holds pg-boss consumers + audit cronjobs.

## Repos and apps

```
agconn/                       # single repo (monorepo)
  apps/
    web/                          # → us-west1-docker.pkg.dev/<proj>/containers/web
    admin/                        # → containers/admin
  services/
    api/                          # → containers/api
    email-worker/                 # → containers/email-worker
    sms-worker/                   # → containers/sms-worker
    resume-parser/                # → containers/resume-parser
    cert-generator/               # → containers/cert-generator
    scheduler/                    # → containers/scheduler
    flc-verifier/                 # → containers/flc-verifier
    audit-retention/              # → containers/audit-retention
    audit-verifier/               # → containers/audit-verifier
  infra/
    terraform/                    # cluster + node pools + Artifact Registry + Workload Identity + DNS
  deploy/
    k8s/
      base/                       # Deployments, Services, HPA, Ingress, NetworkPolicy, audit CronJobs
      overlays/
        prod/                     # image-tag pinning per release
        preview/                  # (planned) per-PR overlay
  .github/
    workflows/
      ci.yml                      # PR builds + typecheck + i18n parity + convention checks
      deploy.yml                  # main → build matrix → Trivy scan → migrate Job → kustomize apply
      lighthouse.yml              # PR Lighthouse gate
      resume-parser-eval.yml      # parser eval harness
      preview.yml                 # (planned) per-PR preview env
```

Workers are **separate images and Deployments**, not bundled into one image. Each pg-boss consumer has its own queue scaling profile and resource limits. Scheduler is a singleton with `strategy: Recreate`.

## Scope

In scope:

- GKE cluster + node pools provisioned via Terraform (`infra/terraform/`)
- Kustomize manifests for all apps + services (`deploy/k8s/`)
- GitHub Actions workflows: CI, deploy, Lighthouse, resume-parser eval, (planned) preview
- Secrets stored as GitHub Actions secrets → applied as a single `agconn-env` K8s Secret on every deploy
- Production deploy with optional manual approval via GitHub Environment protection rules
- Trivy CVE scan gate on every image push
- Sentry release tagging with `GITHUB_SHA`
- Lighthouse CI gates on top public pages
- Pod Security Admission `restricted` namespace label
- NetworkPolicy default-deny ingress + scoped allow rules

Out of scope (MVP):

- Multi-region failover
- Blue/green deploys (rolling is fine — readiness probes + HPA)
- Separate staging cluster (a single prod cluster + PR preview overlays covers the gap)
- In-cluster Prometheus/Grafana (GCP Cloud Logging + Sentry suffice)
- Azure Key Vault / GCP Secret Manager CSI driver (GH secrets → K8s Secret is simpler at scale; revisit when secret-rotation tooling becomes a bottleneck)

## Success criteria

- A push to `main` produces a deployed prod build within 15 minutes (manual approval optional via GH Environment rules).
- Per-PR preview environments accessible at `<pr-id>.preview.agconn.com` within 10 minutes of PR open (planned — see [GAP-CLOSURE-PLAN.md](../../GAP-CLOSURE-PLAN.md) Phase 6 item 6.7).
- Zero-downtime rollout for any standard release (rolling deploy with readiness probes; `db-migrate` Job blocks rollout on failure).
- Rollback to the previous image takes < 2 minutes (`kubectl rollout undo`).
- All secrets in GH Actions secrets — never in repo, never in plain env files.
- Trivy HIGH/CRITICAL with a known fix blocks merge to `main`.
- Lighthouse CI: Perf ≥80, A11y ≥95, SEO ≥95 on top-5 public pages.

## Dependencies

- GCP project + billing account.
- GH repo with secrets configured (see `actionsecrets.md` for the full list).
- DNS for `agconn.com` and subdomains managed in Cloudflare.
- Cloudflare API token (DNS edit scope) wired into both Terraform (for DNS records) and the cluster (cert-manager DNS01 ClusterIssuer).
