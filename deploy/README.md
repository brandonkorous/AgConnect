# Deploy

AKS + GHCR + GitHub Actions. The pipeline builds 5 images, pushes to GHCR, runs Prisma migrations as a one-shot Job, then rolls out web + api + email-worker. Audit retention + verifier are CronJobs.

This is a scaffold. The first deploy requires one-time cluster + Azure setup; after that, every push to `main` deploys.

## Topology

```
agconn.com / www.agconn.com  →  nginx-ingress  →  Service web  →  Deployment web    (Next.js)
api.agconn.com               →  nginx-ingress  →  Service api  →  Deployment api    (Hono)
                                                                  Deployment email-worker (pg-boss consumer)
                                                                  CronJob audit-retention (02:00 UTC)
                                                                  CronJob audit-verifier  (03:00 UTC)
```

Postgres is Azure-managed (Flexible Server). The audit_events table + RLS roles + HMAC come from `packages/db/prisma/migrations`.

## One-time setup

### 1. Azure resources

```bash
RG=agconn-prod
LOC=westus2
KV=agconn-prod-kv
AKS=agconn-prod
ACR=ghcr.io   # using GHCR, not ACR

az group create -n $RG -l $LOC

# Postgres flexible server (private endpoint recommended; public for MVP)
az postgres flexible-server create \
  --resource-group $RG --name agconn-prod-db --location $LOC \
  --admin-user agconn --admin-password "REDACTED" \
  --sku-name Standard_B1ms --tier Burstable --version 16 \
  --storage-size 32 --public-access 0.0.0.0
az postgres flexible-server db create -g $RG -s agconn-prod-db -d agconn

# AKS
az aks create -g $RG -n $AKS \
  --node-count 2 --node-vm-size Standard_B2s \
  --enable-managed-identity --enable-workload-identity --enable-oidc-issuer \
  --enable-addons azure-keyvault-secrets-provider \
  --network-plugin azure --network-plugin-mode overlay \
  --generate-ssh-keys

az aks get-credentials -g $RG -n $AKS

# Key Vault + secrets
az keyvault create -g $RG -n $KV --enable-rbac-authorization true
# Push every secret listed in deploy/k8s/base/secret-provider.yaml:
for k in database-url audit-hmac-key audit-hmac-key-version \
         clerk-secret-key clerk-publishable-key clerk-webhook-secret \
         resend-api-key resend-webhook-secret waitlist-token-secret \
         admin-bearer-token sentry-dsn sentry-public-dsn sentry-auth-token \
         posthog-key posthog-api-key; do
  az keyvault secret set --vault-name $KV --name $k --value "REDACTED"
done
```

### 2. Workload identity → Key Vault

```bash
# User-assigned identity that pods will assume.
UAI_NAME=agconn-prod-workload
az identity create -g $RG -n $UAI_NAME
UAI_CLIENT_ID=$(az identity show -g $RG -n $UAI_NAME --query clientId -o tsv)
UAI_PRINCIPAL_ID=$(az identity show -g $RG -n $UAI_NAME --query principalId -o tsv)

# Grant the identity read on Key Vault secrets.
KV_SCOPE=$(az keyvault show -n $KV --query id -o tsv)
az role assignment create --role "Key Vault Secrets User" \
  --assignee-object-id $UAI_PRINCIPAL_ID --scope $KV_SCOPE

# Federate the identity to the agconn ServiceAccount via OIDC issuer.
OIDC_ISSUER=$(az aks show -g $RG -n $AKS --query oidcIssuerProfile.issuerUrl -o tsv)
az identity federated-credential create -g $RG -n agconn-sa \
  --identity-name $UAI_NAME \
  --issuer "$OIDC_ISSUER" \
  --subject "system:serviceaccount:agconn:agconn" \
  --audiences api://AzureADTokenExchange
```

Then update three placeholders in the manifests:

- `deploy/k8s/base/service-account.yaml` → `azure.workload.identity/client-id: <UAI_CLIENT_ID>`
- `deploy/k8s/base/secret-provider.yaml` → `clientID`, `keyvaultName`, `tenantId`
- `deploy/k8s/base/ingress.yaml` → `email: <ops-email>`

### 3. Cluster-wide controllers

```bash
# nginx ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx --create-namespace

# cert-manager
helm repo add jetstack https://charts.jetstack.io
helm upgrade --install cert-manager jetstack/cert-manager \
  -n cert-manager --create-namespace --version v1.16.0 \
  --set crds.enabled=true
```

Get the ingress controller's public IP, point `agconn.com`, `www.agconn.com`, `api.agconn.com` A records at it.

### 4. GitHub Actions OIDC → Azure

Create an Entra ID app registration with federated credentials for the GitHub OIDC subject (`repo:OWNER/REPO:environment:prod`), then store these GitHub repo secrets:

| secret | value |
|---|---|
| `AZURE_CLIENT_ID` | App registration client id |
| `AZURE_TENANT_ID` | Entra tenant id |
| `AZURE_SUBSCRIPTION_ID` | Subscription containing AKS |
| `AKS_RESOURCE_GROUP` | `agconn-prod` |
| `AKS_CLUSTER_NAME` | `agconn-prod` |
| `SENTRY_AUTH_TOKEN` | Sentry release auth token (only if you want source-map upload from CI) |

### 5. Replace placeholder owner in manifests

The kustomize overlay references `ghcr.io/REPLACE_OWNER/...`. Run once:

```bash
OWNER=$(echo "$GITHUB_REPOSITORY_OWNER" | tr '[:upper:]' '[:lower:]')
find deploy/k8s -type f -name '*.yaml' -exec \
  sed -i "s|REPLACE_OWNER|${OWNER}|g" {} +
git commit -am "chore(deploy): pin GHCR owner"
```

## Routine deploys

After setup, `git push` to `main` triggers `.github/workflows/deploy.yml`:

1. Builds all 5 images in parallel and pushes to GHCR with the commit SHA + `latest` tag.
2. Pins kustomize image tags to the commit SHA.
3. Runs `db-migrate-<sha>` Job and waits for completion (rollout fails if migrations fail).
4. `kubectl apply -k deploy/k8s/overlays/prod`.
5. Waits on `web`, `api`, `email-worker` rollout to finish.

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
# Roll a Deployment back to the previous ReplicaSet:
kubectl -n agconn rollout undo deployment/web
kubectl -n agconn rollout undo deployment/api
```

For database rollback, Azure-managed PITR covers point-in-time restore. Migrations are forward-only by convention; if a migration breaks production, write a follow-up migration that reverses it. Don't `prisma migrate reset` in prod.

## What's NOT in this scaffold

- Preview environments per PR (would need a `preview` overlay + per-PR namespace + DNS automation). Listed for follow-up.
- Sealed/SOPS-encrypted secrets in git. We rely on Key Vault → CSI; nothing sensitive is committed.
- Helm chart packaging. Plain kustomize is enough at MVP scale.
- Multi-region failover, Azure Front Door, or CDN. Single-region until traffic justifies more.
