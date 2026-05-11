# Deploy

GKE + Artifact Registry + GitHub Actions, with Cloudflare in front. The
pipeline builds 6 images, pushes to `us-west1-docker.pkg.dev/agconn/containers/*`,
runs Prisma migrations as a one-shot Job, then rolls out web + api +
email-worker + sms-worker. Audit retention + verifier are CronJobs.

The first deploy requires one-time GCP infra (via Terraform) and cluster
bootstrap (nginx-ingress + cert-manager). After that, every push to `main`
deploys.

## Topology

```
agconn.com / www.agconn.com  →  Cloudflare  →  nginx-ingress  →  Service web  →  Deployment web    (Next.js)
api.agconn.com               →  Cloudflare  →  nginx-ingress  →  Service api  →  Deployment api    (Hono)
                                                                                Deployment email-worker (pg-boss consumer)
                                                                                Deployment sms-worker   (pg-boss consumer)
                                                                                CronJob audit-retention (02:00 UTC)
                                                                                CronJob audit-verifier  (03:00 UTC)
```

Postgres is Supabase. Migrations and audit HMAC roles live under
`packages/db/prisma/migrations`.

## One-time setup

### 1. Provision GCP infra with Terraform

See [`infra/terraform/README.md`](../infra/terraform/README.md). After
`terraform apply` you'll have:

- GCP project `agconn`
- GKE zonal cluster `agconn-prod` in `us-west1-a` (e2-medium, 1–3 node autoscaler)
- Static external IP for the ingress LB
- Workload Identity Federation binding GitHub Actions OIDC → `agconn-deploy@…`
- Cloudflare A records for `agconn.com`, `www.agconn.com`, `api.agconn.com`

Copy the three values printed by Terraform's `github_actions_secrets` output
into GitHub repo Settings → Secrets and variables → Actions:

- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_DEPLOY_SERVICE_ACCOUNT`

### 2. Set the runtime secrets in GitHub Actions

The deploy workflow projects all runtime secrets into a K8s Secret called
`agconn-env` at apply time. Set every name listed below in GitHub repo secrets
before the first deploy:

| Group | Secrets |
|---|---|
| Cloudflare | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` |
| Database | `DATABASE_URL` (Supabase pooler), `DIRECT_URL` (Supabase direct, migrations) |
| Audit | `AUDIT_HMAC_KEY`, `AUDIT_HMAC_KEY_VERSION` |
| Admin | `ADMIN_BEARER_TOKEN`, `PARTICIPANT_PEPPER` (immutable — never rotate) |
| Clerk | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` |
| Resend | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` |
| Waitlist | `WAITLIST_TOKEN_SECRET` |
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` |
| PostHog | `NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_API_KEY` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_ENT_MONTHLY`, `STRIPE_PRICE_ENT_YEARLY` |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_INBOUND_PHONE` (E.164 — public, displayed on marketing surfaces and printed on opt-in flyers) |
| Supabase Storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Mapbox | `NEXT_PUBLIC_MAPBOX_TOKEN` |

### 3. Cluster controllers (Terraform-managed)

`terraform apply` from step 1 installs nginx-ingress, cert-manager, and the
`cloudflare-api-token` Secret automatically — see
[`infra/terraform/cluster-bootstrap.tf`](../infra/terraform/cluster-bootstrap.tf).
Versions are pinned via `var.ingress_nginx_version` / `var.cert_manager_version`
and reapply when bumped. No manual `kubectl` or `helm` commands needed.

### 4. Replace one placeholder in manifests

The cert-manager `ClusterIssuer` references `REPLACE_OPS_EMAIL`. Replace it
once:

```bash
OPS_EMAIL=ops@agconn.com   # used by Let's Encrypt for expiry notices
sed -i "s|REPLACE_OPS_EMAIL|${OPS_EMAIL}|g" deploy/k8s/base/ingress.yaml
git commit -am "chore(deploy): pin Let's Encrypt email"
```

(Image paths are fully qualified in the manifests now — no per-owner placeholder
because Artifact Registry is project-namespaced.)

## Routine deploys

After setup, `git push` to `main` triggers
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):

1. Authenticates to GCP via Workload Identity Federation in the build job and configures docker for Artifact Registry.
2. Builds all 6 images in parallel and pushes to `us-west1-docker.pkg.dev/agconn/containers/*` with the commit SHA + `latest` tag.
3. Authenticates to GCP again in the deploy job; pulls cluster credentials.
4. Applies the namespace + ServiceAccount, then the `agconn-env` Secret (rebuilt every deploy from GH secrets — rotation = redeploy).
5. Pins kustomize image tags to the commit SHA.
6. Runs `db-migrate-<sha>` Job and waits for completion (rollout fails if migrations fail).
7. `kubectl apply -k deploy/k8s/overlays/prod`.
8. Waits on `web`, `api`, `email-worker`, `sms-worker` rollout to finish.

CronJobs (`audit-retention`, `audit-verifier`) update on apply but only run on schedule.

## Local testing of the docker images

```bash
# Build any image to verify the Dockerfile:
docker build -f apps/web/Dockerfile -t agconn-web:dev .
docker build -f services/api/Dockerfile -t agconn-api:dev .

# Run with envs from local .env:
docker run --rm -p 3000:3000 --env-file .env agconn-web:dev
docker run --rm -p 3001:3001 --env-file .env --network host agconn-api:dev
```

## Rollback

```bash
kubectl -n agconn rollout undo deployment/web
kubectl -n agconn rollout undo deployment/api
kubectl -n agconn rollout undo deployment/email-worker
kubectl -n agconn rollout undo deployment/sms-worker
```

For database rollback, Supabase Pro provides daily automated backups +
point-in-time recovery (7-day window). Migrations are forward-only by
convention; if a migration breaks production, write a follow-up migration that
reverses it. Don't `prisma migrate reset` in prod.

## What's NOT in this scaffold

- Preview environments per PR (would need a `preview` overlay + per-PR namespace + DNS automation). Listed for follow-up; trivially added when needed.
- Sealed/SOPS-encrypted secrets in git. We rely on GitHub Actions secrets → kubectl create Secret; nothing sensitive is committed.
- Helm chart packaging. Plain kustomize is enough at MVP scale.
- Multi-region failover or multi-zone HA. Single-zone (us-west1-a) until traffic justifies more — first zonal cluster has free cluster-management fee.
- A staging environment. Prod-only until funding lands; mitigations are additive-only DB migrations + fast `rollout undo` rollback.
