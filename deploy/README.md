# Deploy

GKE + GHCR + GitHub Actions, with Cloudflare in front. The pipeline builds 6
images, pushes to GHCR, runs Prisma migrations as a one-shot Job, then rolls
out web + api + email-worker + sms-worker. Audit retention + verifier are
CronJobs.

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
| Admin | `ADMIN_BEARER_TOKEN` |
| Clerk | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` |
| Resend | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` |
| Waitlist | `WAITLIST_TOKEN_SECRET` |
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` |
| PostHog | `NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_API_KEY` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_ENT_MONTHLY`, `STRIPE_PRICE_ENT_YEARLY` |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_INBOUND_PHONE` |
| Supabase Storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Mapbox | `NEXT_PUBLIC_MAPBOX_TOKEN` |

### 3. Install cluster controllers (nginx-ingress + cert-manager)

```bash
gcloud container clusters get-credentials agconn-prod --zone us-west1-a --project agconn

# Static IP from terraform output:
INGRESS_IP=$(terraform -chdir=infra/terraform output -raw ingress_ip)

# nginx-ingress, pinned to the static IP we allocated.
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx --create-namespace \
  --set controller.service.loadBalancerIP="${INGRESS_IP}" \
  --set controller.service.externalTrafficPolicy=Local

# cert-manager (DNS01 with Cloudflare).
helm repo add jetstack https://charts.jetstack.io
helm upgrade --install cert-manager jetstack/cert-manager \
  -n cert-manager --create-namespace --version v1.16.0 \
  --set crds.enabled=true

# Cloudflare API token Secret in the cert-manager namespace, used by the
# DNS01 ClusterIssuer in deploy/k8s/base/ingress.yaml. Same token value as
# the GH Actions CLOUDFLARE_API_TOKEN secret.
kubectl -n cert-manager create secret generic cloudflare-api-token \
  --from-literal=api-token='YOUR_CLOUDFLARE_API_TOKEN'
```

### 4. Replace placeholders in manifests

The kustomize overlay and the migrate Job reference `ghcr.io/REPLACE_OWNER/...`
and the ClusterIssuer references `REPLACE_OPS_EMAIL`. Run once:

```bash
OWNER=$(echo "$GITHUB_REPOSITORY_OWNER" | tr '[:upper:]' '[:lower:]')
OPS_EMAIL=ops@agconn.com   # used by Let's Encrypt for expiry notices
find deploy/k8s -type f -name '*.yaml' -exec \
  sed -i "s|REPLACE_OWNER|${OWNER}|g; s|REPLACE_OPS_EMAIL|${OPS_EMAIL}|g" {} +
git commit -am "chore(deploy): pin GHCR owner + Let's Encrypt email"
```

## Routine deploys

After setup, `git push` to `main` triggers
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):

1. Builds all 6 images in parallel and pushes to GHCR with the commit SHA + `latest` tag.
2. Authenticates to GCP via Workload Identity Federation; pulls cluster credentials.
3. Applies the namespace and the `agconn-env` Secret (rebuilt every deploy from GH secrets — rotation = redeploy).
4. Pins kustomize image tags to the commit SHA.
5. Runs `db-migrate-<sha>` Job and waits for completion (rollout fails if migrations fail).
6. `kubectl apply -k deploy/k8s/overlays/prod`.
7. Waits on `web`, `api`, `email-worker`, `sms-worker` rollout to finish.

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
