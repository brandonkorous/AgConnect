# 10 — Infra & CI/CD: Overview

## Purpose

Host AgConn on Azure Kubernetes Service (AKS), build and store images in GitHub Container Registry (GHCR), and deploy via GitHub Actions on push to `main`. Per kickoff ADR-004 and §3.

## What this layer owns

- AKS cluster topology (Deployments, Services, Ingress, HPA)
- GHCR image build and push
- GitHub Actions pipeline (build → test → image → deploy)
- Environment strategy (dev / preview / staging / prod)
- Azure Key Vault secret management via CSI driver
- TLS certs via cert-manager / Let's Encrypt
- Monitoring (Prometheus / Grafana / Sentry)
- Database backups (Azure-managed PITR)

## Stack

- **AKS** (Azure Kubernetes Service) — managed K8s
- **GHCR** — `ghcr.io/agconn/<app>:<sha>` private registry
- **GitHub Actions** — CI/CD
- **Helm 3** — manifest templating
- **Nginx Ingress** — Layer 7 ingress
- **cert-manager** — Let's Encrypt automation
- **Azure Key Vault + CSI driver** — secrets
- **Prometheus + Grafana** (managed via Azure Monitor for containers) — metrics
- **Sentry** — application error tracking

## Topology summary

```
Internet
  ↓
Azure Front Door / DNS (agconn.com, *.agconn.com)
  ↓
Nginx Ingress (AKS)
  ↓
─ web      (Next.js app, Deployment, HPA min=2)
─ api      (Hono API, Deployment, HPA min=2)
─ admin    (Next.js admin, Deployment, replicas=2 fixed)
─ workers  (pg-boss workers — sms, email, parser, certs — Deployment min=1)

Azure Postgres Flexible Server (separate from cluster)
Azure Blob Storage (separate)
Azure Key Vault (separate, mounted via CSI)
```

## Repos and apps

```
agconn/                       # single repo (monorepo)
  apps/
    web/                          # → ghcr.io/agconn/web
    api/                          # → ghcr.io/agconn/api
    admin/                        # → ghcr.io/agconn/admin
    workers/                      # → ghcr.io/agconn/workers (pg-boss workers in one image)
  infra/
    helm/agconn/               # umbrella chart
      charts/web, api, admin, workers, postgres-init/
      values-dev.yaml, values-staging.yaml, values-prod.yaml
    k8s/                          # raw manifests (overlay-style fallback)
  .github/
    workflows/
      ci.yml                      # PR builds + tests + lint + lighthouse
      deploy.yml                  # main → build images → deploy
      preview.yml                 # PR → preview namespace
```

> **Inferred:** Workers (pg-boss handlers for sms, email, resume-parse, cert-gen) bundle into a single image with multiple entrypoints. Separating into per-worker Deployments is straightforward later if scaling pressure requires.

## Scope

In scope:

- AKS cluster provisioned via Terraform OR Azure Portal (one-time setup)
- Helm charts for all apps
- GitHub Actions workflows
- Secrets in Key Vault, mounted at startup
- Per-PR preview environments
- Production deploy with manual approval gate
- Sentry integration in all apps
- Lighthouse CI for SEO/perf gating

Out of scope:

- Multi-region failover
- Blue/green deploys (rolling is fine for MVP)
- Cluster autoscaler tuning beyond defaults
- Database migrations across regions

## Success criteria

- A push to `main` produces a deployed prod build within 15 minutes (with manual approval).
- Per-PR preview environments accessible at `<pr-id>.preview.agconn.com` within 10 minutes of PR open.
- Zero-downtime rollout for any standard release (rolling deploy with readiness probes).
- Rollback to the previous image takes < 2 minutes (`kubectl rollout undo`).
- All secrets in Key Vault — never in repo, never in plain env files.

## Dependencies

- Azure subscription + resource group + AKS cluster (one-time provisioning).
- GitHub repo with secrets configured: `AZURE_CREDENTIALS`, `GHCR_TOKEN`, `GITHUB_TOKEN`.
- DNS for `agconn.com` and subdomains.
